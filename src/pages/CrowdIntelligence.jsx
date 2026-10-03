import { Fragment, useMemo, useState } from 'react'
import { useSnapshot } from '../hooks/useSnapshot'
import { daySeries } from '../data/demo'
import { PageHeader, Card, Tile, Loading, STATUS_HEX, STATUS_LABEL } from '../components/ui'

const hexFor = (pct) => (pct < 25 ? STATUS_HEX.low : pct < 60 ? STATUS_HEX.normal : pct < 85 ? STATUS_HEX.busy : STATUS_HEX.crowded)
const alpha = (pct) => Math.round((0.18 + 0.82 * Math.min(1, pct / 100)) * 255).toString(16).padStart(2, '0')
const statusOf = (pct) => (pct < 25 ? 'low' : pct < 60 ? 'normal' : pct < 85 ? 'busy' : 'crowded')

export default function CrowdIntelligence() {
  const snap = useSnapshot()
  const series = useMemo(() => daySeries(new Date()), [])
  const cols = useMemo(() => series.filter((s) => s.hour % 1 === 0), [series])
  const [sel, setSel] = useState(null)
  if (!snap) return <Loading text="Loading crowd data…" />

  const rows = snap.buildings
  const nowHour = new Date().getHours()
  const ranked = [...rows].sort((a, b) => b.pct - a.pct)

  let top = { pct: -1 }
  for (const s of series) {
    for (const b of s.buildings) if (b.pct > top.pct) top = { pct: b.pct, id: b.id, name: b.name, hour: s.hour, label: s.label }
  }
  const totals = series.map((s) => ({ s, total: s.buildings.reduce((a, b) => a + b.occupancy, 0) }))
  const peakHour = totals.reduce((a, t) => (t.total > a.total ? t : a), totals[0])

  const active = sel || { id: top.id, hour: Math.floor(top.hour) }
  const col = cols.find((c) => c.hour === active.hour) || cols[0]
  const cell = col.buildings.find((b) => b.id === active.id)
  const st = statusOf(cell.pct)

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Crowd Intelligence" subtitle="Which place is busy at which hour. Click any cell for details." />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Busiest right now" value={ranked[0].name} sub={`${ranked[0].pct}% full`} />
        <Tile label="Quietest right now" value={ranked[ranked.length - 1].name} sub={`${ranked[ranked.length - 1].pct}% full`} />
        <Tile label="Campus-wide peak" value={peakHour.s.label} sub={`${peakHour.total.toLocaleString()} people in buildings`} />
        <Tile label="Most crowded today" value={`${top.pct}%`} sub={`${top.name} at ${top.label}`} />
      </section>

      <Card title="Occupancy heatmap" subtitle="Rows are places, columns are hours of the day. Brighter and warmer means more crowded. Amber outline is the current hour.">
        <div className="overflow-x-auto">
          <div
            style={{ display: 'grid', gridTemplateColumns: `150px repeat(${cols.length}, minmax(30px, 1fr))`, minWidth: 780, gap: 3 }}
          >
            <div />
            {cols.map((c) => (
              <div key={c.hour} className={'text-center font-mono text-[10px] ' + (c.hour === nowHour ? 'text-warn' : 'text-mute')}>
                {c.label.slice(0, 2)}
              </div>
            ))}
            {rows.map((r) => (
              <Fragment key={r.id}>
                <div className="truncate pr-2 text-sm">{r.name}</div>
                {cols.map((c) => {
                  const b = c.buildings.find((x) => x.id === r.id)
                  const selected = active.id === r.id && active.hour === c.hour
                  return (
                    <button
                      key={c.hour}
                      onClick={() => setSel({ id: r.id, hour: c.hour })}
                      title={`${r.name} at ${c.label}: ${b.pct}%`}
                      className="h-7 rounded-sm"
                      style={{
                        background: hexFor(b.pct) + alpha(b.pct),
                        outline: selected ? '2px solid var(--color-ink)' : c.hour === nowHour ? '1px solid var(--color-warn)' : 'none',
                      }}
                    />
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-mute">
          {Object.keys(STATUS_LABEL).map((k) => (
            <span key={k} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_HEX[k] }} />
              {STATUS_LABEL[k]}
            </span>
          ))}
        </div>
      </Card>

      <Card title={`${cell.name} at ${col.label}`}>
        <div className="grid gap-4 sm:grid-cols-4">
          <Fact label="Occupancy" value={`${cell.occupancy} / ${cell.capacity}`} />
          <Fact label="Filled" value={`${cell.pct}%`} />
          <Fact label="Status" value={STATUS_LABEL[st]} />
          <Fact label="Vs normal" value={`${cell.deviation >= 0 ? '+' : ''}${cell.deviation}%`} warn={cell.anomalous} />
        </div>
      </Card>
    </div>
  )
}

function Fact({ label, value, warn }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-mute">{label}</div>
      <div className={`mt-1 font-mono text-xl ${warn ? 'text-warn' : ''}`}>{value}</div>
    </div>
  )
}