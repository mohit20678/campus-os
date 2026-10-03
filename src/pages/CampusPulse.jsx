import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useSnapshot } from '../hooks/useSnapshot'
import { daySeries, fmtHour } from '../data/demo'
import { PageHeader, Card, Tile, Loading, TIP } from '../components/ui'

function band(v) {
  if (v >= 80) return { label: 'Excellent', cls: 'text-ok' }
  if (v >= 65) return { label: 'Healthy', cls: 'text-accent' }
  if (v >= 50) return { label: 'Under strain', cls: 'text-warn' }
  return { label: 'Critical', cls: 'text-bad' }
}

function TrendChart({ data, dataKey, name, color, nowLabel, domain }) {
  const id = `fill-${dataKey}`
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" stroke="var(--color-mute)" fontSize={11} interval={3} />
          <YAxis stroke="var(--color-mute)" fontSize={11} domain={domain} />
          <Tooltip contentStyle={TIP} labelStyle={{ color: 'var(--color-mute)' }} />
          <ReferenceLine x={nowLabel} stroke="var(--color-warn)" strokeDasharray="4 4" />
          <Area type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2} fill={`url(#${id})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function CampusPulse() {
  const snap = useSnapshot()
  const series = useMemo(() => daySeries(new Date()), [])
  if (!snap) return <Loading text="Loading pulse…" />

  const now = new Date()
  const h = now.getHours() + now.getMinutes() / 60
  const nowLabel = fmtHour(Math.min(22, Math.max(6, Math.round(h * 2) / 2)))
  const best = series.reduce((a, s) => (s.pulse > a.pulse ? s : a), series[0])
  const worst = series.reduce((a, s) => (s.pulse < a.pulse ? s : a), series[0])
  const peak = series.reduce((a, s) => (s.students > a.students ? s : a), series[0])
  const status = band(snap.pulse)

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Campus Pulse" subtitle="One health score for the whole campus, built from six measurable parts." />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Pulse right now" value={snap.pulse} sub={status.label} subCls={status.cls} />
        <Tile label="Best time today" value={best.label} sub={`Pulse ${best.pulse}`} />
        <Tile label="Most strained" value={worst.label} sub={`Pulse ${worst.pulse}`} />
        <Tile label="Peak crowd" value={peak.label} sub={`${peak.students.toLocaleString()} students`} />
      </section>

      <Card title="Pulse through the day" subtitle="The dashed line marks the current time.">
        <TrendChart data={series} dataKey="pulse" name="Pulse" color="var(--color-accent)" nowLabel={nowLabel} domain={[0, 100]} />
      </Card>

      <Card title="Students on campus" subtitle="Simulated headcount through the day.">
        <TrendChart data={series} dataKey="students" name="Students" color="var(--color-ok)" nowLabel={nowLabel} domain={[0, 'auto']} />
      </Card>

      <Card title="How the score is built" subtitle="Pulse is a weighted average of six sub-scores. The weights are shown so nothing is hidden.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-mute">
                <th className="pb-2 font-normal">Part</th>
                <th className="pb-2 font-normal">Score</th>
                <th className="pb-2 font-normal">Weight</th>
                <th className="pb-2 text-right font-normal">Adds</th>
              </tr>
            </thead>
            <tbody>
              {snap.subscores.map((s) => (
                <tr key={s.key} className="border-t border-line">
                  <td className="py-2">{s.label}</td>
                  <td className="py-2 font-mono">{s.value}</td>
                  <td className="py-2 font-mono text-mute">{Math.round(s.weight * 100)}%</td>
                  <td className="py-2 text-right font-mono">{(s.value * s.weight).toFixed(1)}</td>
                </tr>
              ))}
              <tr className="border-t border-line">
                <td className="py-2 font-semibold" colSpan={3}>Campus Pulse</td>
                <td className="py-2 text-right font-mono font-semibold">{snap.pulse}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

