import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Placeholder from './pages/Placeholder'
import { NAV } from './nav'

// Every file in src/pages is picked up automatically.
const modules = import.meta.glob('./pages/*.jsx', { eager: true })
const byName = Object.fromEntries(
  Object.entries(modules).map(([path, m]) => [path.split('/').pop().replace('.jsx', ''), m.default])
)

// Which page file belongs to which menu item
const FILES = {
  '/map': 'CampusMap',
  '/pulse': 'CampusPulse',
  '/crowd': 'CrowdIntelligence',
  '/resources': 'ResourceMonitor',
  '/anomalies': 'AnomalyRadar',
  '/memory': 'CampusMemory',
  '/problems': 'ProblemRadar',
  '/insights': 'AIInsights',
  '/simulator': 'WhatIfSimulator',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/profile': 'Profile',
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        {NAV.filter((n) => n.path !== '/').map((n) => {
          const Page = byName[FILES[n.path]]
          return (
            <Route
              key={n.path}
              path={n.path.slice(1)}
              element={Page ? <Page /> : <Placeholder title={n.label} phase={n.phase} />}
            />
          )
        })}
      </Route>
    </Routes>
  )
}