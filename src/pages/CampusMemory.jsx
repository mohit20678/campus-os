import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dayStats, addDays, dateLabel } from '../data/analysis'
import { resourceSeries, fmtHour } from '../data/demo'
import { PageHeader, Card, Tile, Tabs, TIP } from '../components/ui'

const RANGES = ['Today', 'Yesterday', 'This week', 'This month', 'This semester']
const SPAN = { 'This week': 7, 'This month': 30, 'This semester': 90 }
const DOT = { info: 'bg-accent', warn: 'bg-warn', bad: 'bg-bad' }

function rainy(date) {
  let h = 2166136261
  const s = date.toDateString() + 'rain'
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100) / 100 < 0.25
}

function dayEvents(date) {
  const st = dayStats(date)
  const rs = resourceSeries(date)
  const ev = []
  const open = st.series.find((s) => s.students >= 1000)
  if (open) ev.push({ hour: open.hour, title: 'Campus filling up', text: `${open.students.toLocaleString()} students on campus`, kind: 'info' })
  ev.push({ hour: st.peak.hour, title: 'Peak crowd', text: `${st.peak.students.toLocaleString()} students on campus`, kind: 'info' })
  for (const c of st.crowded) ev.push({ hour: c.hour, title: `${c.name} crowded`, text: `Reached ${c.pct}% of capacity`, kind: 'warn' })
  for (const e of st.episodes) {
    ev.push({ hour: e.from, title: `Anomaly: ${e.name}`, text: `${e.peakDev}% above normal until ${fmtHour(e.to + 0.5)}`, kind: 'bad' })
  }
  const pk = rs.reduce((a, r) => (r.energy > a.energy ? r : a), rs[0])
  ev.push({ hour: pk.hour, title: 'Power draw peaked', text: `${pk.energy} kW across campus`, kind: 'info' })
  ev.push({ hour: st.low.hour, title: 'Lowest campus pulse', text: `Pulse dipped to ${st.low.pulse}`, kind: 'warn' })
  if (rainy(date)) ev.push({ hour: 16.5, title: 'Rain detected', text: 'Light rain, outdoor areas emptied (simulated)', kind: 'info' })
  return ev.sort((a, b) => a.hour - b.hour)
}

export default function CampusMemory() {
  const [range, setRange] = useState('Today')
  const isDay = range === 'Today' || range === 'Yesterday'

  const day = useMemo(() => {
    if (!isDay) return null
    const date = range === 'Today' ? new Date() : addDays(new Date(), -1)
    return { date, events: dayEvents(date), st: dayStats(date) }
  }, [range, isDay])

  const period = useMemo(() => {
    if (isDay) return null
    const n = SPAN[range]
    const rows = []
    for (let i = n - 1; i >= 0; i--) {
      const d = addDays(new Date(), -i)
      const st = dayStats(d)
      rows.push({
        label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        full: dateLabel(d),
        students: st.peak.students,
        pulse: st.avgPulse,
        episodes: st.episodes.length,
      })
    }
    return rows
  }, [range, isDay])

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Campus Memory" subtitle="A timeline of what happened on campus. Move between days, weeks and the whole semester." />
      <Tabs options={RANGES} value={range} onChange={setRange} />

      {isDay && (
        <>
          <section className="grid gap-4 sm:grid-cols-4">
            <Tile label="Peak crowd" value={day.st.peak.students.toLocaleString()} sub={`at ${day.st.peak.label}`} />
            <Tile label="Average pulse" value={day.st.avgPulse} />
            <Tile label="Anomaly episodes" value={day.st.episodes.length} warn={day.st.episodes.length > 0} />
            <Tile label="Events logged" value={day.events.length} />
          </section>
          <Card title={dateLabel(day.date)} subtitle="Everything notable, in time order.">
            <ol className="space-y-4">
              {day.events.map((e, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-14 shrink-0 font-mono text-sm text-mute">{fmtHour(e.hour)}</div>
                  <div className="relative border-l border-line pl-5">
                    <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ${DOT[e.kind]}`} />
                    <div className="font-semibold">{e.title}</div>
                    <div className="text-sm text-mute">{e.text}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}

      {!isDay && (
        <>
          <section className="grid gap-4 sm:grid-cols-4">
            <Tile label="Busiest day" value={period.reduce((a, r) => (r.students > a.students ? r : a), period[0]).label} sub={`${Math.max(...period.map((r) => r.students)).toLocaleString()} students`} />
            <Tile label="Average pulse" value={Math.round(period.reduce((a, r) => a + r.pulse, 0) / period.length)} />
            <Tile label="Anomaly episodes" value={period.reduce((a, r) => a + r.episodes, 0)} warn />
            <Tile label="Days covered" value={period.length} />
          </section>
          <Card title="Peak students per day" subtitle={`${range}. Weekends are the quiet dips.`}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={period} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--color-mute)" fontSize={11} interval={Math.max(0, Math.floor(period.length / 10))} />
                  <YAxis stroke="var(--color-mute)" fontSize={11} />
                  <Tooltip contentStyle={TIP} labelStyle={{ color: 'var(--color-mute)' }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="students" name="Peak students" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card title="Days with the most anomalies">
            <div className="space-y-2 text-sm">
              {[...period]
                .filter((r) => r.episodes > 0)
                .sort((a, b) => b.episodes - a.episodes || b.students - a.students)
                .slice(0, 6)
                .map((r) => (
                  <div key={r.full} className="flex justify-between border-t border-line pt-2">
                    <span>{r.full}</span>
                    <span className="font-mono text-warn">{r.episodes} episode{r.episodes > 1 ? 's' : ''}</span>
                  </div>
                ))}
              {period.every((r) => r.episodes === 0) && <p className="text-mute">No anomalies in this period.</p>}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}