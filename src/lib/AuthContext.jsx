import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase, supabaseReady } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(supabaseReady)

  const loadProfile = useCallback(async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(data ?? null)
  }, [])

  useEffect(() => {
    if (!supabaseReady) return undefined
    let alive = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return
      setSession(data.session)
      if (data.session) await loadProfile(data.session.user.id)
      if (alive) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) setTimeout(() => loadProfile(s.user.id), 0)
      else setProfile(null)
    })

    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = {
    configured: supabaseReady,
    loading,
    session,
    user: session ? session.user : null,
    profile,
    isAdmin: profile?.role === 'admin',
    signUp: ({ email, password, full_name, class_name, branch, year, semester }) =>
      supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name, class_name, branch, year, semester } },
      }),
    signIn: ({ email, password }) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
    refreshProfile: () => (session ? loadProfile(session.user.id) : Promise.resolve()),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}