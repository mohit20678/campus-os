import { useEffect, useState } from 'react'
import { getSnapshot } from '../data/dataSource'
import PulseRing from '../components/PulseRing'

const STATUS = {
  low: { label: 'Low activity', cls: 'bg-info' },
  normal: { label: 'Normal', cls: 'bg-ok' },
  busy: { label: 'Busy', cls: 'bg-warn' },
  crowded: { label: 'Crowded', cls: 'bg-bad' },
}

export default function Overview() {
  const [snap, setSnap] = useState(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const s = await getSnapshot()
      if (alive) setSnap(s)
    }
    load()
    const t = setInterval(load, 5000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  if (!snap) return <div className="p-8 text-mute">Loading campus…</div>

  const time = new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const sorted = [...snap.buildings].sort((a, b) => b.pct - a.pct)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Campus Overview</h1>
        <p className="font-mono text-xs text-mute">Updated {time}</p>
      </div>

      <section className="grid gap-6 rounded-2xl border border-line bg-panel p-6 lg:grid-cols-[auto_1fr]">
        <div className="relative mx-auto">
          <PulseRing value={snap.pulse} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono text-xs tracking-widest text-mute">CAMPUS PULSE</div>
            <div className="font-display text-6xl font-bold">{snap.pulse}</div>
            <div className="font-mono text-xs text-mute">/ 100</div>
          </div>
        </div>

        <div className="space-y-3 self-center">
          {snap.subscores.map((s) => (
            <div key={s.key}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-mute">{s.label}</span>
                <span className="font-mono">{s.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-line">
                <div
                  className="h-1.5 rounded-full bg-accent transition-all duration-1000"
                  style={{ width: `${s.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Students on campus" value={snap.studentsOnCampus.toLocaleString()} />
        <Stat label="Open problems" value={snap.openProblems} />
        <Stat label="Anomalies now" value={snap.anomalies.length} warn={snap.anomalies.length > 0} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-panel p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Anomaly Radar</h2>
          {snap.anomalies.length === 0 && (
            <p className="text-sm text-mute">Everything is within normal range.</p>
          )}
          {snap.anomalies.map((a) => (
            <div key={a.id} className="mb-3 rounded-xl border border-warn/30 bg-warn/5 p-4">
              <div className="font-semibold text-warn">⚠ {a.name}</div>
              <p className="mt-1 text-sm text-mute">
                {a.occupancy} people now vs {a.baseline} expected at this time (+{a.deviation}%).
              </p>
              <div className="mt-2 font-mono text-xs text-mute">Confidence {a.confidence}%</div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-line bg-panel p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Locations right now</h2>
          <div className="space-y-2">
            {sorted.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS[b.status].cls}`} />
                  {b.name}
                </div>
                <div className="font-mono text-mute">
                  {b.pct}% · {STATUS[b.status].label}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value, warn }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <div className="text-xs uppercase tracking-widest text-mute">{label}</div>
      <div className={`mt-1 font-display text-4xl font-bold ${warn ? 'text-warn' : ''}`}>{value}</div>
    </div>
  )
}