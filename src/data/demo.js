import { BUILDINGS } from './buildings'
import { generateSnapshot } from './generator'

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

const pad = (n) => String(n).padStart(2, '0')
export const fmtHour = (h) => `${pad(Math.floor(h))}:${h % 1 ? '30' : '00'}`

function atHour(date, h) {
  const d = new Date(date)
  d.setHours(Math.floor(h), h % 1 ? 30 : 0, 0, 0)
  return d
}

// Campus snapshots every 30 minutes from 06:00 to 22:00
export function daySeries(date = new Date()) {
  const out = []
  for (let h = 6; h <= 22; h += 0.5) {
    const s = generateSnapshot(atHour(date, h))
    out.push({
      hour: h,
      label: fmtHour(h),
      pulse: s.pulse,
      students: s.studentsOnCampus,
      anomalies: s.anomalies,
      buildings: s.buildings,
    })
  }
  return out
}

// Energy (kW) and water (kL) for every hour, with the expected level next to it
export function resourceSeries(date = new Date()) {
  const dk = date.toISOString().slice(0, 10)
  const out = []
  for (let h = 0; h < 24; h++) {
    const s = generateSnapshot(atHour(date, h))
    const total = s.buildings.reduce((sum, b) => sum + b.occupancy, 0)
    const expectedEnergy = 80 + total * 0.09
    const energy = expectedEnergy * (1 + (hash(dk + 'en' + h) - 0.45) * 0.14)
    const expectedWater = 4 + total * 0.004
    const water = expectedWater * (1 + (hash(dk + 'wa' + h) - 0.45) * 0.14)
    out.push({
      hour: h,
      label: fmtHour(h),
      energy: Math.round(energy),
      expectedEnergy: Math.round(expectedEnergy),
      water: Math.round(water * 10) / 10,
      expectedWater: Math.round(expectedWater * 10) / 10,
    })
  }
  return out
}

// Waste Detective (demo): empty rooms with lights and AC on.
// Assumptions: AC 1.8 kW, lights 0.3 kW, electricity Rs 8 per kWh.
const WASTE_RAW = [
  ['B-204', 'Block B', 47],
  ['A-110', 'Block A', 32],
  ['Lab 3', 'Central Labs', 65],
  ['C-301', 'Block C', 28],
  ['Seminar Hall 2', 'Seminar Hall', 54],
]
export const WASTE = WASTE_RAW.map(([room, building, minutes]) => {
  const kwh = ((1.8 + 0.3) * minutes) / 60
  return {
    room,
    building,
    minutes,
    occupancy: 0,
    kwh: Math.round(kwh * 100) / 100,
    cost: Math.round(kwh * 8 * 10) / 10,
  }
})

// Campus events that can explain unusual crowds
export const EVENTS = [
  { id: 'exam', title: 'Mid-semester examination period', affects: ['library', 'blockA', 'blockB', 'blockC'] },
  { id: 'deadline', title: 'Assignment submission deadline', affects: ['library', 'labs'] },
  { id: 'fest', title: 'Technical fest rehearsals', affects: ['seminar', 'sports', 'canteen'] },
  { id: 'timetable', title: 'Overlapping timetable slot around 1 PM', affects: ['blockC', 'canteen', 'blockB'] },
]

export function likelyCauses(buildingId) {
  return EVENTS.filter((e) => e.affects.includes(buildingId))
}

// Problem Radar data: 71 problems, 23 open (2 critical, 7 high, 14 medium) and 48 resolved
export const CATEGORIES = [
  'Infrastructure', 'Cleanliness', 'Electricity', 'Water', 'Internet',
  'Safety', 'Classroom', 'Laboratory', 'Transport', 'Canteen',
]

const ISSUES = {
  Infrastructure: 'Broken furniture',
  Cleanliness: 'Washroom needs cleaning',
  Electricity: 'Power fluctuation',
  Water: 'Low water pressure',
  Internet: 'Wi-Fi connectivity drops',
  Safety: 'Poor corridor lighting',
  Classroom: 'Projector not working',
  Laboratory: 'Lab system not booting',
  Transport: 'Bus running late',
  Canteen: 'Long queue and seating shortage',
}

export const PROBLEMS = Array.from({ length: 71 }, (_, i) => {
  const open = i < 23
  const r = (k) => hash('prob' + i + k)
  const category =
    r('c') < 0.28 ? 'Internet' : CATEGORIES[Math.floor(r('cc') * CATEGORIES.length)]
  const location =
    category === 'Internet' && r('l') < 0.6
      ? 'Block B'
      : BUILDINGS[Math.floor(r('ll') * BUILDINGS.length)].name
  const severity = open
    ? i < 2 ? 'Critical' : i < 9 ? 'High' : 'Medium'
    : r('s') < 0.2 ? 'High' : r('s') < 0.6 ? 'Medium' : 'Low'
  return {
    id: `P-${1000 + i}`,
    title: ISSUES[category],
    category,
    location,
    severity,
    status: open ? 'Open' : 'Resolved',
    ageDays: open ? Math.round(r('a') * 9) : 1 + Math.round(r('ag') * 29),
    resolutionDays: open ? null : Math.round((0.5 + r('rd') * 4) * 10) / 10,
  }
})

export function problemStats(list = PROBLEMS) {
  const open = list.filter((p) => p.status === 'Open')
  const resolved = list.filter((p) => p.status === 'Resolved')
  const count = (arr, key) =>
    arr.reduce((m, p) => {
      m[p[key]] = (m[p[key]] || 0) + 1
      return m
    }, {})
  const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0]
  return {
    critical: open.filter((p) => p.severity === 'Critical').length,
    high: open.filter((p) => p.severity === 'High').length,
    medium: open.filter((p) => p.severity === 'Medium').length,
    resolved: resolved.length,
    mostRepeated: top(count(list, 'category')),
    mostAffected: top(count(list, 'location')),
    avgResolution:
      Math.round((resolved.reduce((s, p) => s + p.resolutionDays, 0) / resolved.length) * 10) / 10,
  }
}