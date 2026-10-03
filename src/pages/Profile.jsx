import { useState } from 'react'
import { useSnapshot } from '../hooks/useSnapshot'
import { daySeries } from '../data/demo'
import { getSettings, saveSettings } from '../data/settings'
import { PageHeader, Card, Loading } from '../components/ui'

const ROLES = ['Principal', 'Facility manager', 'Student', 'Demo viewer']
const CAPS = [
  ['View campus map', [1, 1, 1, 1]],
  ['View anomalies and insights', [1, 1, 0, 1]],
  ['Run What-If simulations', [1, 0, 0, 0]],
  ['Generate reports', [1, 1, 0, 0]],
  ['Manage problems and alerts', [1, 1, 0, 0]],
  ['Report a problem', [1, 1, 1, 0]],
  ['Find a place', [1, 1, 1, 1]],
]

export default function Profile() {
  const snap = useSnapshot()
  const [name, setName] = useState(getSettings().name)
  const [role, setRole] = useState(getSettings().role)
  const [saved, setSaved] = useState(false)
  if (!snap) return <Loading />

  const roleIdx = ROLES.indexOf(role)
  const academic = snap.buildings.filter((b) => b.type === 'academic').sort((a, b) => a.pct - b.pct)
  const canteen = snap.buildings.find((b) => b.id === 'canteen')
  const freeBlock = academic[0]
  // Study spaces: the least crowded of the library, the labs and the seminar hall
  const study = snap.buildings
    .filter((b) => ['library', 'lab', 'hall'].includes(b.type))
    .sort((a, b) => a.pct - b.pct)[0]

  const nowH = new Date().getHours()
  const quiet = daySeries(new Date())
    .filter((s) => s.hour >= Math.max(nowH, 8) && s.hour % 1 === 0 && s.hour <= 18)
    .map((s) => ({ label: s.label, pct: s.buildings.find((b) => b.id === 'canteen').pct }))
    .sort((a, b) => a.pct - b.pct)[0]

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Profile" subtitle="Who is using CAMPUS OS, what they can do, and the student view." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Your profile">
          <div className="space-y-4 text-sm">
            <label className="block">
              <span className="text-mute">Name</span>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSaved(false)
                }}
                className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-mute">Role (demo switch)</span>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value)
                  setSaved(false)
                }}
                className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2"
              >
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <button
              onClick={() => {
                saveSettings({ name, role })
                setSaved(true)
              }}
              className="rounded-xl bg-accent px-5 py-2 font-semibold text-bg hover:opacity-90"
            >
              Save profile
            </button>
            {saved && <span className="ml-3 text-ok">Saved</span>}
            <p className="text-xs text-mute">
              In this prototype the role is a switch for demonstration. With login added (Supabase Auth), each role would be enforced by the database.
            </p>
          </div>
        </Card>

        <Card title={`What a ${role} can do`}>
          <div className="space-y-2 text-sm">
            {CAPS.map(([label, flags]) => (
              <div key={label} className="flex items-center justify-between border-t border-line pt-2">
                <span className={flags[roleIdx] ? '' : 'text-mute'}>{label}</span>
                <span className={flags[roleIdx] ? 'text-ok' : 'text-mute'}>{flags[roleIdx] ? 'Allowed' : 'Not allowed'}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Find a place" subtitle="The student view: where to go right now.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Spot label="Quiet study space" title={study.name} note={`${study.pct}% full, about ${study.capacity - study.occupancy} spaces free`} />
          <Spot label="Least crowded block" title={freeBlock.name} note={`${freeBlock.pct}% full`} />
          <Spot label="Canteen" title={canteen.pct >= 60 ? 'Busy now' : 'Easy to get a seat'} note={quiet ? `Quietest time to eat: ${quiet.label} (${quiet.pct}% full)` : 'No more lunch slots today'} />
          <Spot label="Least crowded route" title={`Main Gate → Admin → ${freeBlock.name}`} note="Based on current crowd levels" />
        </div>
      </Card>
    </div>
  )
}

function Spot({ label, title, note }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="text-xs uppercase tracking-widest text-mute">{label}</div>
      <div className="mt-1 font-display text-lg font-bold">{title}</div>
      <div className="mt-1 text-sm text-mute">{note}</div>
    </div>
  )
}