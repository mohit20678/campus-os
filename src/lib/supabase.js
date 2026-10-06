import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

let client = null
try {
  if (url && key) {
    client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  }
} catch (e) {
  console.error('Supabase setup problem:', e.message)
}

// The site never crashes if the keys are missing or wrong. Pages check supabaseReady.
export const supabase = client
export const supabaseReady = Boolean(client)
