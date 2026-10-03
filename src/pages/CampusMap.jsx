import { useEffect, useMemo, useState } from 'react'
import { getSnapshot } from '../data/dataSource'
import { daySeries, likelyCauses } from '../data/demo'

const COLOR = {
  low: 'var(--color-info)',
  normal: 'var(--color-ok)',
  busy: 'var(--color-warn)',
  crowded: 'var(--color-bad)',
}
const LABEL = { low: 'Low activity', normal: 'Normal', busy: 'Busy', crowded: 'Crowded' }
const SHORT = { admin: 'Admin', labs: 'Labs', seminar: 'Seminar', sports: 'Sports' }

export default function CampusMap() {
  const [snap, setSnap] = useState(null)
  const [selectedId, setSelectedId] = useState('library')
  const series = useMemo(() => daySeries(new Date()), [])

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

  if (!snap) return <div className="p-8 text-mute">Loading map…</div>

  const b = snap.buildings.find((x) => x.id === selectedId)
  const peak = series.reduce(
    (best, s) => {
      const cur = s.buildings.find((x) => x.id === selectedId)
      return cur.pct > best.pct ? { pct: cur.pct, label: s.label } : best
    },
    { pct: -1, label: '' }
  )
  const causes = b.anomalous ? likelyCauses(b.id) : []

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Campus Map</h1>
        <p className="text-sm text-mute">Digital twin of the campus. Click any building for details.</p>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-mute">
        {Object.keys(LABEL).map((k) => (
          <span key={k} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[k] }} />
            {LABEL[k]}
          </span>
        ))}
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-sm border border-warn" />
          Anomaly
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <svg viewBox="0 0 100 100" className="w-full rounded-2xl border border-line bg-panel">
          <g stroke="var(--color-line)" strokeWidth="0.6" fill="none">
            <line x1="50" y1="92" x2="50" y2="10" />
            <line x1="12" y1="56" x2="88" y2="56" />
            <line x1="24" y1="33" x2="76" y2="33" />
          </g>

          {snap.buildings.map((x) => (
            <g key={x.id} onClick={() => setSelectedId(x.id)} style={{ cursor: 'pointer' }}>
              {x.anomalous && (
                <rect
                  x={x.x - 9.2}
                  y={x.y - 5.7}
                  width="18.4"
                  height="11.4"
                  rx="2.4"
                  fill="none"
                  stroke="var(--color-warn)"
                  strokeWidth="0.5"
                  className="animate-pulse"
                />
              )}
              <rect
                x={x.x - 8}
                y={x.y - 4.5}
                width="16"
                height="9"
                rx="1.8"
                fill={COLOR[x.status]}
                fillOpacity="0.18"
                stroke={COLOR[x.status]}
                strokeWidth={x.id === selectedId ? 0.9 : 0.4}
              />
              <text
                x={x.x}
                y={x.y - 0.4}
                fontSize="2.3"
                fill="var(--color-ink)"
                textAnchor="middle"
              >
                {SHORT[x.id] || x.name}
              </text>
              <text
                x={x.x}
                y={x.y + 2.8}
                fontSize="2.1"
                fill={COLOR[x.status]}
                textAnchor="middle"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {x.pct}%
              </text>
            </g>
          ))}
        </svg>

        <aside className="rounded-2xl border border-line bg-panel p-6">
          <div className="text-xs uppercase tracking-widest text-mute">{b.type}</div>
          <h2 className="font-display text-2xl font-bold">{b.name}</h2>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[b.status] }} />
            {LABEL[b.status]}
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <Row label="Current occupancy" value={`${b.occupancy} / ${b.capacity} (${b.pct}%)`} />
            <Row label="Normal for this time" value={b.baseline} />
            <Row
              label="Vs normal"
              value={`${b.deviation >= 0 ? '+' : ''}${b.deviation}%`}
              warn={b.anomalous}
            />
            <Row label="Today's peak" value={`${peak.pct}% at ${peak.label}`} />
            <Row
              label="Energy load (est.)"
              value={`${b.deviation >= 0 ? '+' : ''}${Math.round(b.deviation * 0.4)}%`}
            />
            <Row label="Alerts" value={b.anomalous ? 1 : 0} warn={b.anomalous} />
          </div>

          {b.anomalous && (
            <div className="mt-5 rounded-xl border border-warn/30 bg-warn/5 p-4 text-sm">
              <div className="font-semibold text-warn">⚠ Anomaly detected</div>
              <p className="mt-1 text-mute">
                Occupancy is {b.deviation}% above the expected level.
              </p>
              {causes.length > 0 && (
                <p className="mt-2 text-xs text-mute">
                  Possible factors: {causes.map((c) => c.title).join(', ')}.
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value, warn }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-mute">{label}</span>
      <span className={`font-mono ${warn ? 'text-warn' : ''}`}>{value}</span>
    </div>
  )
}