import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { NAV } from '../nav'
import { useAuth } from '../lib/AuthContext'

const GROUPS = ['Observe', 'Understand', 'Decide']

const linkClass = ({ isActive }) =>
  'block whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ' +
  (isActive ? 'bg-white/10 text-ink' : 'text-mute hover:text-ink')

export default function Layout() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const name = (profile && profile.full_name) || (user && user.email) || ''
  const detail = profile ? `${profile.branch} · Year ${profile.year} · Sem ${profile.semester}` : ''

  const logout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-line bg-panel p-4 md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="mb-4 flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}hitam-logo.png`} alt="HITAM logo" className="h-12 w-12 rounded-xl" />
          <div>
            <div className="font-display text-xl font-bold tracking-tight">
              CAMPUS<span className="text-accent"> OS</span>
            </div>
            <div className="text-xs text-mute">The intelligence layer for your campus.</div>
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto md:block">
          {GROUPS.map((group) => (
            <div key={group} className="flex gap-1 md:mb-5 md:block">
              <div className="hidden px-3 pb-1 text-[11px] uppercase tracking-widest text-mute md:block">
                {group}
              </div>
              {NAV.filter((n) => n.group === group).map((n) => (
                <NavLink key={n.path} to={n.path} end={n.path === '/'} className={linkClass}>
                  {n.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-3">
          <div className="flex items-center gap-2 font-mono text-xs text-mute">
            <span className="h-2 w-2 animate-pulse rounded-full bg-ok" />
            LIVE
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden rounded-full border border-warn/40 px-3 py-1 font-mono text-[11px] text-warn md:inline">
              DEMO DATA · SIMULATED
            </span>
            <div className="text-right leading-tight">
              <div className="text-sm font-semibold">{name}</div>
              {detail && <div className="text-[11px] text-mute">{detail}</div>}
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-mute hover:border-accent hover:text-ink"
            >
              Log out
            </button>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
