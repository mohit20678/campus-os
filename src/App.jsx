import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Placeholder from './pages/Placeholder'
import { NAV } from './nav'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        {NAV.filter((n) => n.path !== '/').map((n) => (
          <Route
            key={n.path}
            path={n.path.slice(1)}
            element={<Placeholder title={n.label} phase={n.phase} />}
          />
        ))}
      </Route>
    </Routes>
  )
}