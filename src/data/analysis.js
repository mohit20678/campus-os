import { daySeries, resourceSeries, WASTE, problemStats, fmtHour, likelyCauses } from './demo'
import { getSettings } from './settings'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const weekdayName = (d) => DAYS[d.getDay()]
export const addDays = (date, n) => {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
export const dateLabel = (d) =>
  d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// One day, summarised: crowd, pulse, anomaly episodes, first time each place got crowded
const cache = new Map()
export function dayStats(date) {
  const key = date.toDateString() + '|' + getSettings().threshold
  if (cache.has(key)) return cache.get(key)

  const series = daySeries(date)
  let activity = 0
  let peak = series[0]
  let low = series[0]
  const open = {}
  const episodes = []
  const crowded = {}

  for (const s of series) {
    activity += s.students * 0.5 // student-hours
    if (s.students > peak.students) peak = s
    if (s.pulse < low.pulse) low = s

    const active = new Set()
    for (const a of s.anomalies) {
      active.add(a.id)
      if (!open[a.id]) {
        open[a.id] = { id: a.id, name: a.name, from: s.hour, to: s.hour, peakDev: a.deviation, occ: a.occupancy, base: a.baseline }
        episodes.push(open[a.id])
      } else {
        const e = open[a.id]
        e.to = s.hour
        if (a.deviation > e.peakDev) {
          e.peakDev = a.deviation
          e.occ = a.occupancy
          e.base = a.baseline
        }
      }
    }
    for (const id of Object.keys(open)) if (!active.has(id)) delete open[id]

    for (const b of s.buildings) {
      if (b.type !== 'hostel' && b.status === 'crowded' && !crowded[b.id]) {
        crowded[b.id] = { id: b.id, name: b.name, hour: s.hour, pct: b.pct }
      }
    }
  }

  const out = {
    series,
    activity: Math.round(activity),
    peak,
    low,
    avgPulse: Math.round(series.reduce((a, s) => a + s.pulse, 0) / series.length),
    episodes,
    crowded: Object.values(crowded),
  }
  cache.set(key, out)
  return out
}

// Average activity on the same weekday over the previous few weeks
export function typicalActivity(date, weeks = 4) {
  let sum = 0
  for (let k = 1; k <= weeks; k++) sum += dayStats(addDays(date, -7 * k)).activity
  return sum / weeks
}

// Places that were flagged on several of the last N days
export function repeatedPatterns(date, days = 14) {
  const map = {}
  for (let i = 1; i <= days; i++) {
    const st = dayStats(addDays(date, -i))
    const seen = new Set()
    for (const e of st.episodes) {
      const m = map[e.id] || (map[e.id] = { id: e.id, name: e.name, days: 0, from: 0, to: 0, peakDev: 0, n: 0 })
      if (!seen.has(e.id)) {
        m.days += 1
        seen.add(e.id)
      }
      m.from += e.from
      m.to += e.to + 0.5
      m.n += 1
      m.peakDev = Math.max(m.peakDev, e.peakDev)
    }
  }
  return Object.values(map)
    .map((m) => ({
      ...m,
      avgFrom: Math.round((m.from / m.n) * 2) / 2,
      avgTo: Math.round((m.to / m.n) * 2) / 2,
    }))
    .sort((a, b) => b.days - a.days)
}

export function energySummary(date) {
  const rs = resourceSeries(date)
  const total = rs.reduce((a, r) => a + r.energy, 0)
  const expected = rs.reduce((a, r) => a + r.expectedEnergy, 0)
  const peak = rs.reduce((a, r) => (r.energy > a.energy ? r : a), rs[0])
  return { total, expected, diffPct: Math.round((total / expected - 1) * 100), peak }
}

export function wasteTotals() {
  return {
    rooms: WASTE.length,
    kwh: Math.round(WASTE.reduce((a, w) => a + w.kwh, 0) * 100) / 100,
    cost: Math.round(WASTE.reduce((a, w) => a + w.cost, 0) * 10) / 10,
  }
}

// The daily "Campus Intelligence" report. Every number comes from the data above.
export function buildReport(date = new Date()) {
  const st = dayStats(date)
  const typical = typicalActivity(date)
  const actPct = typical ? Math.round((st.activity / typical - 1) * 100) : 0
  const en = energySummary(date)
  const ps = problemStats()
  const patterns = repeatedPatterns(date, 14).filter((p) => p.days >= 3)
  const openCount = ps.critical + ps.high + ps.medium

  const paragraphs = []
  const activityText =
    Math.abs(actPct) < 2
      ? `Campus activity was in line with a typical ${weekdayName(date)}.`
      : `Campus activity was ${Math.abs(actPct)}% ${actPct >= 0 ? 'higher' : 'lower'} than a typical ${weekdayName(date)}.`
  paragraphs.push(
    `${activityText} Student presence peaked at ${st.peak.students.toLocaleString()} around ${st.peak.label}, and the average Campus Pulse was ${st.avgPulse}.`
  )

  if (st.episodes.length) {
    const e = [...st.episodes].sort((a, b) => b.peakDev - a.peakDev)[0]
    const causes = likelyCauses(e.id).map((c) => c.title.toLowerCase())
    paragraphs.push(
      `${e.name} showed unusually high occupancy between ${fmtHour(e.from)} and ${fmtHour(e.to + 0.5)}, reaching ${e.peakDev}% above its expected level.` +
        (causes.length ? ` Possible contributing factors: ${causes.join('; ')}.` : '')
    )
  } else {
    paragraphs.push('No location moved far outside its normal range today.')
  }

  if (st.crowded.length) {
    paragraphs.push(
      `Crowding (above 85% of capacity) was recorded at ${st.crowded.map((c) => `${c.name} (${fmtHour(c.hour)})`).join(', ')}.`
    )
  }

  const energyText =
    Math.abs(en.diffPct) < 2
      ? 'Energy use was in line with the expected level'
      : `Energy use was ${Math.abs(en.diffPct)}% ${en.diffPct >= 0 ? 'above' : 'below'} the expected level`
  paragraphs.push(`${energyText}, with peak demand of ${en.peak.energy} kW at ${en.peak.label}.`)
  paragraphs.push(
    `${openCount} problems are open (${ps.critical} critical). The most repeated category is ${ps.mostRepeated[0]} with ${ps.mostRepeated[1]} reports, and the most affected location is ${ps.mostAffected[0]}.`
  )

  const top = patterns[0]
  return {
    title: date.toDateString() === new Date().toDateString() ? "Today's Campus Intelligence" : 'Campus Intelligence',
    dateLabel: dateLabel(date),
    stats: [
      { label: 'Activity vs typical', value: `${actPct >= 0 ? '+' : ''}${actPct}%` },
      { label: 'Peak students', value: st.peak.students.toLocaleString() },
      { label: 'Average pulse', value: st.avgPulse },
      { label: 'Anomaly episodes', value: st.episodes.length },
      { label: 'Energy vs expected', value: `${en.diffPct >= 0 ? '+' : ''}${en.diffPct}%` },
      { label: 'Open problems', value: openCount },
    ],
    paragraphs,
    keyInsight: top
      ? `${top.name} congestion is becoming a repeated pattern (flagged on ${top.days} of the last 14 days).`
      : 'No repeated congestion pattern was found in the last 14 days.',
    recommendation: top
      ? `Recommended investigation: check timetable overlap and room allocation around ${fmtHour(top.avgFrom)} at ${top.name}.`
      : 'Recommended investigation: none needed. Continue monitoring.',
    disclaimer:
      'System-generated from simulated demo data. Treat these insights as leads to investigate, not confirmed facts.',
  }
}

export function reportToText(r) {
  return [
    r.title.toUpperCase(),
    r.dateLabel,
    '',
    ...r.stats.map((s) => `${s.label}: ${s.value}`),
    '',
    ...r.paragraphs.flatMap((p) => [p, '']),
    `KEY INSIGHT: ${r.keyInsight}`,
    r.recommendation,
    '',
    r.disclaimer,
  ].join('\n')
}