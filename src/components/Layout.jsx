import { NavLink, Outlet } from 'react-router-dom'
import { NAV } from '../nav'

const GROUPS = ['Observe', 'Understand', 'Decide']

const linkClass = ({ isActive }) =>
  'block whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ' +
  (isActive ? 'bg-white/10 text-ink' : 'text-mute hover:text-ink')

export default function Layout() {
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-line bg-panel p-4 md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="mb-4 flex items-center gap-3">
  <img
    src={`${import.meta.env.BASE_URL}hitam-logo.png`}
    alt="HITAM logo"
    className="h-12 w-12 rounded-xl"
  />
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
        <header className="flex items-center justify-between border-b border-line px-6 py-3">
          <div className="flex items-center gap-2 font-mono text-xs text-mute">
            <span className="h-2 w-2 animate-pulse rounded-full bg-ok" />
            LIVE
          </div>
          <span className="rounded-full border border-warn/40 px-3 py-1 font-mono text-[11px] text-warn">
            DEMO DATA · SIMULATED
          </span>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}