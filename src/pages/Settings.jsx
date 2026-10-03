import { useState } from 'react'
import { getSettings, saveSettings, resetSettings, DEFAULTS } from '../data/settings'
import { PageHeader, Card } from '../components/ui'

const WEIGHTS = [
  ['Campus Crowd', 25],
  ['Energy', 20],
  ['Student Activity', 15],
  ['Safety', 15],
  ['Problems', 15],
  ['Water', 10],
]

export default function Settings() {
  const [s, setS] = useState(() => ({ ...getSettings() }))
  const [saved, setSaved] = useState(false)

  const save = () => {
    saveSettings({ threshold: s.threshold, refresh: s.refresh })
    setSaved(true)
  }
  const reset = () => {
    resetSettings()
    setS({ ...DEFAULTS })
    setSaved(true)
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Settings" subtitle="Tune how sensitive the radar is and how often the dashboard refreshes." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Anomaly sensitivity" subtitle="A place is flagged when it is this far above its expected level.">
          <div className="mb-1 flex justify-between text-sm">
            <span>Threshold</span>
            <span className="font-mono">{s.threshold}% above normal</span>
          </div>
          <input
            type="range"
            min="15"
            max="60"
            step="5"
            value={s.threshold}
            onChange={(e) => {
              setS({ ...s, threshold: Number(e.target.value) })
              setSaved(false)
            }}
            className="w-full accent-accent"
          />
          <p className="mt-2 text-xs text-mute">Lower means more alerts. Higher means only big spikes are flagged.</p>
        </Card>

        <Card title="Refresh rate" subtitle="How often live pages ask for new data.">
          <div className="mb-1 flex justify-between text-sm">
            <span>Every</span>
            <span className="font-mono">{s.refresh} seconds</span>
          </div>
          <input
            type="range"
            min="2"
            max="30"
            step="1"
            value={s.refresh}
            onChange={(e) => {
              setS({ ...s, refresh: Number(e.target.value) })
              setSaved(false)
            }}
            className="w-full accent-accent"
          />
          <p className="mt-2 text-xs text-mute">Applies the next time you open a page.</p>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} className="rounded-xl bg-accent px-5 py-2.5 font-semibold text-bg hover:opacity-90">
          Save settings
        </button>
        <button onClick={reset} className="rounded-xl border border-line px-5 py-2.5 text-sm text-mute hover:text-ink">
          Reset to defaults
        </button>
        {saved && <span className="text-sm text-ok">Saved. Pages use the new values when you open them.</span>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Campus Pulse weights" subtitle="How much each part counts toward the score.">
          <div className="space-y-2 text-sm">
            {WEIGHTS.map(([n, w]) => (
              <div key={n} className="flex items-center justify-between border-t border-line pt-2">
                <span>{n}</span>
                <span className="font-mono text-mute">{w}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Data source" subtitle="Where the numbers come from.">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-accent bg-accent/10 px-4 py-3">
              <span>Demo (simulated)</span>
              <span className="text-xs text-ok">Active</span>
            </div>
            {['Supabase database', 'Wi-Fi access-point counts', 'Energy and water meters'].map((x) => (
              <div key={x} className="flex items-center justify-between rounded-lg border border-line px-4 py-3 text-mute">
                <span>{x}</span>
                <span className="text-xs">Planned</span>
              </div>
            ))}
            <p className="text-xs text-mute">Real sources plug in through one file (src/data/dataSource.js), so the pages do not change.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}