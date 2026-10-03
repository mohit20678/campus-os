import { useMemo } from 'react'
import { dayStats, repeatedPatterns, energySummary, wasteTotals } from '../data/analysis'
import { problemStats, fmtHour } from '../data/demo'
import { PageHeader } from '../components/ui'

const LEVEL = {
  warn: 'border-warn/40 bg-warn/5',
  info: 'border-line bg-panel',
  ok: 'border-ok/30 bg-ok/5',
}

function buildInsights() {
  const now = new Date()
  const list = []

  for (const p of repeatedPatterns(now, 14).filter((x) => x.days >= 3)) {
    list.push({
      level: 'warn',
      tag: 'Repeated pattern',
      title: `${p.name} congestion is becoming a repeated pattern`,
      evidence: `Flagged on ${p.days} of the last 14 days, usually between ${fmtHour(p.avgFrom)} and ${fmtHour(p.avgTo)}, up to ${p.peakDev}% above normal.`,
      action: `Check timetable overlap and room allocation around ${fmtHour(p.avgFrom)} at ${p.name}.`,
      confidence: Math.min(92, 50 + p.days * 7),
    })
  }

  const st = dayStats(now)
  const canteen = st.series.reduce((a, s) => {
    const b = s.buildings.find((x) => x.id === 'canteen')
    return b.pct > a.pct ? { pct: b.pct, label: s.label } : a
  }, { pct: -1, label: '' })
  list.push({
    level: canteen.pct >= 85 ? 'warn' : 'info',
    tag: 'Crowd',
    title: `The canteen peaks at ${canteen.label}`,
    evidence: `It reaches ${canteen.pct}% of capacity at its busiest point today.`,
    action: 'Try staggering lunch breaks by about 15 minutes across departments, then compare the next peak.',
    confidence: 78,
  })

  const en = energySummary(now)
  list.push({
    level: Math.abs(en.diffPct) >= 5 ? 'warn' : 'ok',
    tag: 'Energy',
    title:
      Math.abs(en.diffPct) < 3
        ? 'Energy use is in line with the crowd'
        : `Energy use is ${Math.abs(en.diffPct)}% ${en.diffPct > 0 ? 'above' : 'below'} what the crowd explains`,
    evidence: `Peak demand was ${en.peak.energy} kW at ${en.peak.label}. Expected and actual use are compared hour by hour.`,
    action: en.diffPct > 5 ? 'Look at labs and air conditioning schedules for the hours with the largest gap.' : 'No action needed. Keep monitoring.',
    confidence: 70,
  })

  const w = wasteTotals()
  list.push({
    level: 'warn',
    tag: 'Waste',
    title: `${w.rooms} empty rooms had lights and AC on`,
    evidence: `About ${w.kwh} kWh (₹${w.cost}) wasted in this snapshot. If it happened every working day, that is roughly ₹${Math.round(w.cost * 22)} per month (22 working days, demo estimate).`,
    action: 'Pilot automatic switch-off for rooms empty for more than 15 minutes.',
    confidence: 66,
  })

  const ps = problemStats()
  list.push({
    level: 'warn',
    tag: 'Recurring problem',
    title: `${ps.mostRepeated[0]} problems keep coming back`,
    evidence: `${ps.mostRepeated[1]} reports this semester, with ${ps.mostAffected[0]} the most affected location. Average fix time is ${ps.avgResolution} days.`,
    action: `Inspect the underlying cause at ${ps.mostAffected[0]} instead of closing each report separately.`,
    confidence: 81,
  })

  return list
}

export default function AIInsights() {
  const insights = useMemo(buildInsights, [])
  return (
    <div className="space-y-6 p-6">
      <PageHeader title="AI Insights" subtitle="Patterns the system noticed across crowds, energy and complaints." />

      <div className="rounded-xl border border-line bg-panel px-4 py-3 text-sm text-mute">
        These are system-generated leads based on simulated data. They tell you where to look, not what is certain.
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {insights.map((i, n) => (
          <section key={n} className={`rounded-2xl border p-6 ${LEVEL[i.level]}`}>
            <div className="text-xs uppercase tracking-widest text-mute">{i.tag}</div>
            <h2 className="mt-1 font-display text-lg font-bold">{i.title}</h2>
            <p className="mt-2 text-sm text-mute">{i.evidence}</p>
            <div className="mt-3 rounded-lg bg-white/5 p-3 text-sm">
              <span className="text-mute">Recommended investigation: </span>
              {i.action}
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between font-mono text-xs text-mute">
                <span>Confidence</span>
                <span>{i.confidence}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-line">
                <div className="h-1.5 rounded-full bg-accent" style={{ width: `${i.confidence}%` }} />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}