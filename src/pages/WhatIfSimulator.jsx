import { useState } from 'react'
import { BASE, ASSUMPTIONS, simulate, levelOf } from '../data/simulator'
import { PageHeader, Card } from '../components/ui'

const FIELDS = [
  { key: 'students', label: 'Students', min: 1500, max: 8000, step: 50 },
  { key: 'classrooms', label: 'Classrooms', min: 20, max: 120, step: 1 },
  { key: 'canteens', label: 'Canteens', min: 1, max: 5, step: 1 },
  { key: 'parking', label: 'Parking spaces', min: 200, max: 1500, step: 10 },
  { key: 'library', label: 'Library seats', min: 300, max: 1500, step: 10 },
  { key: 'labs', label: 'Labs', min: 6, max: 50, step: 1 },
]

const PRESETS = [
  { name: 'Admit 1,000 more students', set: { students: 4241 } },
  { name: 'Add a second canteen', set: { canteens: 2 } },
  { name: 'Grow to 4,000 students, but 35 classrooms', set: { students: 4000, classrooms: 35 } },
  { name: 'Expand everything', set: { students: 4000, classrooms: 80, canteens: 2, parking: 700, library: 1000, labs: 24 } },
]

const COLOR = { ok: 'text-ok', warn: 'text-warn', bad: 'text-bad' }
const BAR = { ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad' }

export default function WhatIfSimulator() {
  const [scn, setScn] = useState(BASE)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const run = () => {
    const r = simulate(scn)
    setResult(r)
    setHistory((h) => [{ scn, rows: r.rows }, ...h].slice(0, 5))
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="What-If Simulator" subtitle="Change the campus, run the simulation, and see the projected pressure before any money is spent." />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card title="Scenario" subtitle="Current values are the starting point.">
          <div className="mb-5 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setScn({ ...BASE, ...p.set })
                  setResult(null)
                }}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:text-ink"
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{f.label}</span>
                  <span className="font-mono">
                    <span className="text-mute">{BASE[f.key].toLocaleString()} → </span>
                    <span className={scn[f.key] !== BASE[f.key] ? 'text-accent' : ''}>{scn[f.key].toLocaleString()}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={scn[f.key]}
                  onChange={(e) => setScn({ ...scn, [f.key]: Number(e.target.value) })}
                  className="w-full accent-accent"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={run} className="flex-1 rounded-xl bg-accent px-4 py-2.5 font-semibold text-bg hover:opacity-90">
              Run simulation
            </button>
            <button
              onClick={() => {
                setScn(BASE)
                setResult(null)
              }}
              className="rounded-xl border border-line px-4 py-2.5 text-sm text-mute hover:text-ink"
            >
              Reset
            </button>
          </div>
        </Card>

        <div className="space-y-6">
          {!result && (
            <Card title="Projected effects">
              <p className="text-sm text-mute">Pick a preset or move the sliders, then press Run simulation.</p>
            </Card>
          )}

          {result && (
            <>
              <Card title="Projected effects" subtitle="Utilisation is demand divided by capacity. Above 90% is critical.">
                <div className="space-y-4">
                  {result.rows.map((r) => {
                    const lvl = levelOf(r.next)
                    return (
                      <div key={r.key}>
                        <div className="mb-1 flex items-baseline justify-between text-sm">
                          <span>{r.label}</span>
                          <span className="font-mono">
                            <span className="text-mute">{r.now}% → </span>
                            <span className={COLOR[lvl]}>{r.next}%</span>
                            <span className={`ml-3 ${r.change > 0 ? 'text-warn' : r.change < 0 ? 'text-ok' : 'text-mute'}`}>
                              {r.change > 0 ? '+' : ''}{r.change}%
                            </span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-line">
                          <div className={`h-2 rounded-full ${BAR[lvl]} transition-all duration-700`} style={{ width: `${Math.min(100, r.next)}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card title="What this means">
                {result.advice.length === 0 ? (
                  <p className="text-sm text-ok">No area would hit its limit in this scenario.</p>
                ) : (
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    {result.advice.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
          )}

          <Card title="Assumptions" subtitle="Planning estimates, not exact predictions.">
            <ul className="list-disc space-y-1 pl-5 text-sm text-mute">
              {ASSUMPTIONS.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Card>

          {history.length > 1 && (
            <Card title="Recent runs">
              <div className="space-y-2 text-sm">
                {history.map((h, i) => (
                  <div key={i} className="flex justify-between border-t border-line pt-2 text-mute">
                    <span>
                      {h.scn.students.toLocaleString()} students · {h.scn.classrooms} classrooms · {h.scn.canteens} canteen{h.scn.canteens > 1 ? 's' : ''}
                    </span>
                    <span className="font-mono">crowding {h.rows[0].next}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}