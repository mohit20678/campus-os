import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Overview from './pages/Overview'
import Placeholder from './pages/Placeholder'
import Login from './pages/Login'
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
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
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
