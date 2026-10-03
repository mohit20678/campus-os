import { useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useSnapshot } from '../hooks/useSnapshot'
import { dayStats } from '../data/analysis'
import { fmtHour, likelyCauses } from '../data/demo'
import { getSettings } from '../data/settings'
import { PageHeader, Card, Tile, Loading, TIP } from '../components/ui'

export default function AnomalyRadar() {
  const snap = useSnapshot()
  const stats = useMemo(() => dayStats(new Date()), [])
  const [picked, setPicked] = useState(null)
  if (!snap) return <Loading text="Scanning campus…" />

  const selectedId = picked || (snap.anomalies[0] ? snap.anomalies[0].id : stats.episodes[0] ? stats.episodes[0].id : 'library')
  const b = snap.buildings.find((x) => x.id === selectedId)
  const current = snap.anomalies.find((a) => a.id === selectedId)
  const causes = likelyCauses(selectedId)

  const chart = stats.series.map((s) => {
    const x = s.buildings.find((y) => y.id === selectedId)
    return { label: s.label, Observed: x.occupancy, Expected: x.baseline }
  })
  const threshold = getSettings().threshold
  const strongest = [...stats.episodes].sort((a, c) => c.peakDev - a.peakDev)[0]

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Anomaly Radar" subtitle="Finds places that are far above what is normal for this weekday and hour." />

      <section className="grid gap-4 sm:grid-cols-3">
        <Tile label="Anomalies right now" value={snap.anomalies.length} warn={snap.anomalies.length > 0} />
        <Tile label="Episodes today" value={stats.episodes.length} sub="Separate unusual periods" />
        <Tile label="Strongest today" value={strongest ? `+${strongest.peakDev}%` : 'None'} sub={strongest ? strongest.name : 'Everything normal'} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card title="Active now" subtitle="Click one to investigate it.">
            {snap.anomalies.length === 0 && <p className="text-sm text-mute">Everything is within the normal range.</p>}
            {snap.anomalies.map((a) => (
              <button
                key={a.id}
                onClick={() => setPicked(a.id)}
                className={
                  'mb-3 block w-full rounded-xl border p-4 text-left ' +
                  (a.id === selectedId ? 'border-warn bg-warn/10' : 'border-warn/30 bg-warn/5')
                }
              >
                <div className="font-semibold text-warn">⚠ {a.name}</div>
                <p className="mt-1 text-sm text-mute">
                  {a.occupancy} now vs {a.baseline} expected (+{a.deviation}%)
                </p>
                <div className="mt-1 font-mono text-xs text-mute">Confidence {a.confidence}%</div>
              </button>
            ))}
          </Card>

          <Card title="Today's episodes" subtitle="Unusual periods found so far today.">
            {stats.episodes.length === 0 && <p className="text-sm text-mute">No unusual periods today.</p>}
            {stats.episodes.map((e) => (
              <button
                key={e.id + e.from}
                onClick={() => setPicked(e.id)}
                className="mb-2 flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left text-sm hover:border-accent"
              >
                <span>{e.name}</span>
                <span className="font-mono text-xs text-mute">
                  {fmtHour(e.from)}–{fmtHour(e.to + 0.5)} · +{e.peakDev}%
                </span>
              </button>
            ))}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={`${b.name}: expected vs observed`} subtitle="Where the line leaves the dashed one, the radar flags it.">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
              <label className="text-mute" htmlFor="place">Place</label>
              <select
                id="place"
                value={selectedId}
                onChange={(e) => setPicked(e.target.value)}
                className="rounded-lg border border-line bg-bg px-3 py-1.5"
              >
                {snap.buildings.map((x) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--color-mute)" fontSize={11} interval={3} />
                  <YAxis stroke="var(--color-mute)" fontSize={11} />
                  <Tooltip contentStyle={TIP} labelStyle={{ color: 'var(--color-mute)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Observed" stroke="var(--color-warn)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Expected" stroke="var(--color-mute)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Explanation">
            {current ? (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold text-warn">⚠ Anomaly detected.</span> {b.name} has {current.occupancy} people against about{' '}
                  {current.baseline} expected at this time, which is {current.deviation}% above normal.
                </p>
                <p className="text-mute">Confidence: {current.confidence}%.</p>
                {causes.length > 0 && (
                  <p className="text-mute">Possible contributing factors: {causes.map((c) => c.title).join('; ')}.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-mute">
                {b.name} is within its normal range right now ({b.occupancy} people, {b.baseline} expected, {b.deviation >= 0 ? '+' : ''}{b.deviation}%).
              </p>
            )}
          </Card>

          <Card title="How detection works">
            <ul className="list-disc space-y-1 pl-5 text-sm text-mute">
              <li>Every place has an expected headcount for each weekday and hour (the baseline).</li>
              <li>A place is flagged when it is at least {threshold}% above its baseline. You can change this in Settings.</li>
              <li>Confidence rises with the size of the deviation.</li>
              <li>Possible factors come from the campus event calendar and are suggestions, not proof.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}