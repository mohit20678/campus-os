import { useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { resourceSeries, WASTE } from '../data/demo'
import { PageHeader, Card, Tile, TIP } from '../components/ui'

function ResChart({ data, actual, expected, unit, color }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" stroke="var(--color-mute)" fontSize={11} interval={3} />
          <YAxis stroke="var(--color-mute)" fontSize={11} unit={unit} />
          <Tooltip contentStyle={TIP} labelStyle={{ color: 'var(--color-mute)' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey={actual} name="Actual" stroke={color} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey={expected} name="Expected" stroke="var(--color-mute)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function ResourceMonitor() {
  const data = useMemo(() => resourceSeries(new Date()), [])
  const nowH = new Date().getHours()
  const soFar = data.filter((d) => d.hour <= nowH)
  const sum = (arr, k) => arr.reduce((a, r) => a + r[k], 0)
  const energy = sum(soFar, 'energy')
  const energyExp = sum(soFar, 'expectedEnergy')
  const water = Math.round(sum(soFar, 'water') * 10) / 10
  const waterExp = sum(soFar, 'expectedWater')
  const peak = data.reduce((a, r) => (r.energy > a.energy ? r : a), data[0])
  const energyDiff = Math.round((energy / energyExp - 1) * 100)
  const waterDiff = Math.round((water / waterExp - 1) * 100)
  const waste = {
    rooms: WASTE.length,
    kwh: Math.round(WASTE.reduce((a, w) => a + w.kwh, 0) * 100) / 100,
    cost: Math.round(WASTE.reduce((a, w) => a + w.cost, 0) * 10) / 10,
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Resource Monitor" subtitle="Energy and water through the day, compared with what is expected for the crowd." />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Energy so far" value={`${energy.toLocaleString()} kWh`} sub={`${energyDiff >= 0 ? '+' : ''}${energyDiff}% vs expected`} subCls={energyDiff > 5 ? 'text-warn' : 'text-mute'} />
        <Tile label="Water so far" value={`${water} kL`} sub={`${waterDiff >= 0 ? '+' : ''}${waterDiff}% vs expected`} subCls={waterDiff > 5 ? 'text-warn' : 'text-mute'} />
        <Tile label="Peak power draw" value={`${peak.energy} kW`} sub={`at ${peak.label}`} />
        <Tile label="Wasted right now" value={`₹${waste.cost}`} sub={`${waste.rooms} empty rooms, ${waste.kwh} kWh`} warn />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Energy (kW)" subtitle="Hourly power draw across campus.">
          <ResChart data={data} actual="energy" expected="expectedEnergy" unit="" color="var(--color-accent)" />
        </Card>
        <Card title="Water (kL per hour)" subtitle="Hourly water use across campus.">
          <ResChart data={data} actual="water" expected="expectedWater" unit="" color="var(--color-info)" />
        </Card>
      </div>

      <Card
        title="Waste Detective"
        subtitle="Empty rooms with lights and AC left on. Demo estimate: AC 1.8 kW, lights 0.3 kW, electricity at ₹8 per kWh."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-mute">
                <th className="pb-2 font-normal">Room</th>
                <th className="pb-2 font-normal">Building</th>
                <th className="pb-2 font-normal">Empty for</th>
                <th className="pb-2 font-normal">Energy wasted</th>
                <th className="pb-2 text-right font-normal">Cost</th>
              </tr>
            </thead>
            <tbody>
              {WASTE.map((w) => (
                <tr key={w.room} className="border-t border-line">
                  <td className="py-2">
                    <span className="mr-2 text-warn">⚠</span>
                    {w.room}
                  </td>
                  <td className="py-2 text-mute">{w.building}</td>
                  <td className="py-2 font-mono">{w.minutes} min</td>
                  <td className="py-2 font-mono">{w.kwh} kWh</td>
                  <td className="py-2 text-right font-mono">₹{w.cost}</td>
                </tr>
              ))}
              <tr className="border-t border-line font-semibold">
                <td className="py-2" colSpan={3}>Total</td>
                <td className="py-2 font-mono">{waste.kwh} kWh</td>
                <td className="py-2 text-right font-mono">₹{waste.cost}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-mute">
          In the prototype these rooms are simulated. With occupancy and power sensors connected, this list would update on its own.
        </p>
      </Card>
    </div>
  )
}