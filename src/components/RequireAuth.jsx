import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Loading } from './ui'

// Wraps the whole site: anyone who is not logged in is sent to the login page first.
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading text="Checking your session…" />
  if (!user) return <Navigate to="/login" replace />
  return children
}
