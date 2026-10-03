import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PROBLEMS, CATEGORIES, problemStats } from '../data/demo'
import { PageHeader, Card, Tile, TIP } from '../components/ui'

const SEV_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }
const SEV_CLS = {
  Critical: 'border-bad/50 bg-bad/10 text-bad',
  High: 'border-warn/50 bg-warn/10 text-warn',
  Medium: 'border-info/40 bg-info/10 text-info',
  Low: 'border-line text-mute',
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-2 text-sm text-mute">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-line bg-bg px-3 py-1.5 text-ink">
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}

export default function ProblemRadar() {
  const stats = useMemo(() => problemStats(), [])
  const [status, setStatus] = useState('Open')
  const [severity, setSeverity] = useState('All')
  const [category, setCategory] = useState('All')

  const list = useMemo(
    () =>
      PROBLEMS.filter((p) => (status === 'All' || p.status === status) && (severity === 'All' || p.severity === severity) && (category === 'All' || p.category === category)).sort(
        (a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || b.ageDays - a.ageDays
      ),
    [status, severity, category]
  )

  const byCat = useMemo(
    () => CATEGORIES.map((c) => ({ category: c, count: list.filter((p) => p.category === c).length })).sort((a, b) => b.count - a.count),
    [list]
  )

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Problem Radar" subtitle="Complaints turned into patterns: what repeats, where, and how fast it gets fixed." />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Critical" value={stats.critical} warn={stats.critical > 0} sub="open" />
        <Tile label="High" value={stats.high} sub="open" />
        <Tile label="Medium" value={stats.medium} sub="open" />
        <Tile label="Resolved" value={stats.resolved} sub="this semester" subCls="text-ok" />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Tile label="Most repeated problem" value={stats.mostRepeated[0]} sub={`${stats.mostRepeated[1]} reports`} />
        <Tile label="Most affected location" value={stats.mostAffected[0]} sub={`${stats.mostAffected[1]} reports`} />
        <Tile label="Average resolution time" value={`${stats.avgResolution} days`} />
      </section>

      <Card title="Filters">
        <div className="flex flex-wrap gap-4">
          <Select label="Status" value={status} onChange={setStatus} options={['All', 'Open', 'Resolved']} />
          <Select label="Severity" value={severity} onChange={setSeverity} options={['All', 'Critical', 'High', 'Medium', 'Low']} />
          <Select label="Category" value={category} onChange={setCategory} options={['All', ...CATEGORIES]} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card title={`Problems (${list.length})`}>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-panel">
                <tr className="text-left text-xs uppercase tracking-widest text-mute">
                  <th className="pb-2 font-normal">Problem</th>
                  <th className="pb-2 font-normal">Where</th>
                  <th className="pb-2 font-normal">Severity</th>
                  <th className="pb-2 text-right font-normal">Age</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="py-2">
                      <div>{p.title}</div>
                      <div className="font-mono text-[11px] text-mute">{p.id} · {p.category}</div>
                    </td>
                    <td className="py-2 text-mute">{p.location}</td>
                    <td className="py-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${SEV_CLS[p.severity]}`}>{p.severity}</span>
                    </td>
                    <td className="py-2 text-right font-mono text-mute">
                      {p.status === 'Open' ? `${p.ageDays}d open` : `fixed in ${p.resolutionDays}d`}
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-mute">No problems match these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="By category" subtitle="For the filtered list.">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCat} layout="vertical" margin={{ top: 0, right: 12, left: 12, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="var(--color-mute)" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="category" stroke="var(--color-mute)" fontSize={11} width={90} />
                <Tooltip contentStyle={TIP} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="count" name="Problems" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}