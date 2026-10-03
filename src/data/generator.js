import { BUILDINGS } from './buildings'
import { getSettings } from './settings'

const g = (h, mu, s) => Math.exp(-((h - mu) ** 2) / (2 * s * s))
const clamp = (v, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v))

// How busy each type of place is, by hour of day (0 to about 1)
const PROFILES = {
  academic: (h) => 0.9 * g(h, 11, 2.4) + 0.65 * g(h, 14.5, 1.8),
  lab: (h) => 0.85 * g(h, 12, 3),
  library: (h) => 0.75 * g(h, 13, 3.5),
  canteen: (h) => 0.25 * g(h, 10.5, 0.7) + 0.85 * g(h, 13.2, 0.8) + 0.3 * g(h, 16, 0.8),
  gate: (h) => 0.75 * g(h, 9, 0.7) + 0.6 * g(h, 13.5, 0.5) + 0.7 * g(h, 16.5, 0.8),
  sports: (h) => 0.2 * g(h, 7, 1) + 0.7 * g(h, 17, 1.6),
  hostel: (h) => 0.4 + 0.45 * g(h, 21.5, 3.5),
  parking: (h) => 0.9 * g(h, 11.5, 3.2),
  admin: (h) => 0.7 * g(h, 12, 3),
  hall: (h) => 0.5 * g(h, 14, 2),
}

// Turns any text into a repeatable number between 0 and 1
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

const hourOf = (d) => d.getHours() + d.getMinutes() / 60
const dayKey = (d) => d.toISOString().slice(0, 10)

function dayFactor(d, type) {
  if (type === 'hostel') return 1
  const w = d.getDay()
  return w === 0 ? 0.12 : w === 6 ? 0.35 : 1
}

// What we EXPECT at this time (the baseline used for anomaly detection)
export function baselineAt(b, d) {
  return b.capacity * PROFILES[b.type](hourOf(d)) * dayFactor(d, b.type)
}

// What we actually "observe" (baseline + noise + occasional injected events)
export function occupancyAt(b, d) {
  const h = hourOf(d)
  const base = baselineAt(b, d)
  const noise = (hash(b.id + dayKey(d) + Math.floor(h * 30)) - 0.5) * 0.14
  let value = base * (1 + noise)

  const dayNumber = Math.floor(d.getTime() / 86400000)
  if (b.id === 'library' && dayNumber % 3 === 0 && h >= 11 && h <= 14) value *= 1.45
  if (b.id === 'blockC' && dayNumber % 4 === 0 && h >= 13 && h <= 15) value *= 1.4

  return Math.round(clamp(value, 0, b.capacity * 0.99))
}

const statusOf = (pct) => (pct < 25 ? 'low' : pct < 60 ? 'normal' : pct < 85 ? 'busy' : 'crowded')

export function generateSnapshot(d = new Date()) {
  const h = hourOf(d)
  const threshold = getSettings().threshold

  const buildings = BUILDINGS.map((b) => {
    const occupancy = occupancyAt(b, d)
    const baseline = Math.round(baselineAt(b, d))
    const pct = Math.round((occupancy / b.capacity) * 100)
    const deviation =
      baseline > b.capacity * 0.1 ? Math.round(((occupancy - baseline) / baseline) * 100) : 0
    return { ...b, occupancy, baseline, pct, deviation, status: statusOf(pct), anomalous: deviation >= threshold }
  })

  const anomalies = buildings
    .filter((b) => b.anomalous)
    .map((b) => ({
      id: b.id,
      name: b.name,
      occupancy: b.occupancy,
      baseline: b.baseline,
      deviation: b.deviation,
      confidence: Math.min(97, 60 + Math.round(b.deviation / 2)),
    }))
    .sort((a, b) => b.deviation - a.deviation)

  const crowded = buildings.filter((b) => b.status === 'crowded').length
  const busy = buildings.filter((b) => b.status === 'busy').length
  const learning = buildings.filter((b) => ['academic', 'lab', 'library'].includes(b.type))
  const avgLearning = learning.reduce((s, b) => s + b.pct, 0) / learning.length
  const avgAll = buildings.reduce((s, b) => s + b.pct, 0) / buildings.length

  const subscores = [
    { key: 'crowd', label: 'Campus Crowd', value: Math.round(clamp(100 - crowded * 12 - busy * 4)), weight: 0.25 },
    { key: 'activity', label: 'Student Activity', value: Math.round(clamp(35 + avgLearning * 0.65)), weight: 0.15 },
    { key: 'energy', label: 'Energy', value: Math.round(clamp(100 - avgAll * 0.6 - hash(dayKey(d) + 'e') * 8)), weight: 0.2 },
    { key: 'water', label: 'Water', value: Math.round(clamp(68 + hash(dayKey(d) + 'w') * 22)), weight: 0.1 },
    { key: 'safety', label: 'Safety', value: Math.round(clamp(96 - anomalies.length * 3)), weight: 0.15 },
    { key: 'problems', label: 'Problems', value: 68, weight: 0.15 }, // demo value: 23 open problems
  ]

  const pulse = Math.round(subscores.reduce((s, x) => s + x.value * x.weight, 0))
  const studentsOnCampus = Math.round(
    3241 * Math.min(1, 0.05 + 0.95 * dayFactor(d, 'academic') * PROFILES.academic(h))
  )

  return { timestamp: d.toISOString(), pulse, subscores, buildings, anomalies, studentsOnCampus, openProblems: 23 }
}