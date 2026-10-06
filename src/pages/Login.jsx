import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Tabs, Loading } from '../components/ui'

// Demo mode: any email works. When the college approves, set this to the college email ending
// (for example '@hitam.org'). The database rule added at go-live is what really enforces it.
const COLLEGE_DOMAIN = ''

const BRANCHES = [
  'CSE',
  'CSE (AI & ML)',
  'CSE (Data Science)',
  'CSE (Cyber Security)',
  'IT',
  'ECE',
  'EEE',
  'Mechanical',
  'Civil',
  'Other',
]
const YEARS = [1, 2, 3, 4]
const semestersFor = (year) => [year * 2 - 1, year * 2]

const EMPTY = { full_name: '', class_name: '', branch: '', year: '', semester: '', email: '', password: '', confirm: '' }

const inputCls =
  'w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-50'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-mute">{label}</span>
      {children}
    </label>
  )
}

function friendly(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Wrong email or password.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'This email already has an account. Try signing in.'
  if (m.includes('not confirmed')) return 'Please confirm your email first, using the link we sent you.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Wait a few minutes and try again.'
  if (m.includes('database error')) return 'Could not save your profile. Check your year and semester and try again.'
  return msg || 'Something went wrong. Please try again.'
}

function validate(f) {
  if (f.full_name.trim().length < 2) return 'Enter your full name.'
  if (!f.class_name.trim()) return 'Enter your class, for example CSE-A.'
  if (!f.branch) return 'Choose your branch.'
  if (!f.year) return 'Choose your year.'
  if (!f.semester) return 'Choose your semester.'
  const email = f.email.trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email address.'
  if (COLLEGE_DOMAIN && !email.endsWith(COLLEGE_DOMAIN)) return `Use your college email (ending ${COLLEGE_DOMAIN}).`
  if (f.password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) return 'Password needs at least one letter and one number.'
  if (f.password !== f.confirm) return 'Passwords do not match.'
  return ''
}

export default function Login() {
  const { user, loading, configured, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('Sign in')
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)

  if (loading) return <Loading text="Checking your session…" />
  if (user) return <Navigate to="/" replace />

  const isSignUp = mode === 'Create account'
  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => (key === 'year' ? { ...f, year: value, semester: '' } : { ...f, [key]: value }))
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!configured) {
      setError('The website is not connected to Supabase yet. Check the .env.local file and restart the site.')
      return
    }
    const email = form.email.trim().toLowerCase()

    if (!isSignUp) {
      if (!email || !form.password) {
        setError('Enter your email and password.')
        return
      }
      setBusy(true)
      const { error: err } = await signIn({ email, password: form.password })
      setBusy(false)
      if (err) setError(friendly(err.message))
      else navigate('/', { replace: true })
      return
    }

    const problem = validate(form)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    const { data, error: err } = await signUp({
      email,
      password: form.password,
      full_name: form.full_name.trim(),
      class_name: form.class_name.trim(),
      branch: form.branch,
      year: Number(form.year),
      semester: Number(form.semester),
    })
    setBusy(false)
    if (err) {
      setError(friendly(err.message))
      return
    }
    if (data.session) navigate('/', { replace: true })
    else setNotice('Account created. Check your college inbox and click the confirmation link, then sign in.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-center gap-4">
          <img src={`${import.meta.env.BASE_URL}hitam-logo.png`} alt="HITAM" className="h-14 w-14 rounded-xl" />
          <div>
            <div className="font-display text-2xl font-bold tracking-tight">
              CAMPUS<span className="text-accent"> OS</span>
            </div>
            <div className="text-xs text-mute">The intelligence layer for your campus.</div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-6">
          <Tabs
            options={['Sign in', 'Create account']}
            value={mode}
            onChange={(m) => {
              setMode(m)
              setError('')
              setNotice('')
            }}
          />

          <div className="mt-4 rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-warn">
            Demo mode: use a test password, not one you use anywhere else.
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
            {isSignUp && (
              <>
                <Field label="Full name">
                  <input className={inputCls} value={form.full_name} onChange={set('full_name')} autoComplete="name" placeholder="Your full name" />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Class">
                    <input className={inputCls} value={form.class_name} onChange={set('class_name')} placeholder="e.g. CSE-A" />
                  </Field>
                  <Field label="Branch">
                    <select className={inputCls} value={form.branch} onChange={set('branch')}>
                      <option value="">Select branch</option>
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Year">
                    <select className={inputCls} value={form.year} onChange={set('year')}>
                      <option value="">Select year</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>Year {y}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Semester">
                    <select className={inputCls} value={form.semester} onChange={set('semester')} disabled={!form.year}>
                      <option value="">{form.year ? 'Select semester' : 'Choose year first'}</option>
                      {form.year &&
                        semestersFor(Number(form.year)).map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                    </select>
                  </Field>
                </div>
              </>
            )}

            <Field label={COLLEGE_DOMAIN ? 'College email' : 'Email'}>
              <input
                className={inputCls}
                type="email"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                placeholder={COLLEGE_DOMAIN ? `name${COLLEGE_DOMAIN}` : 'you@example.com'}
              />
            </Field>

            <div className={isSignUp ? 'grid gap-4 sm:grid-cols-2' : ''}>
              <Field label="Password">
                <input
                  className={inputCls}
                  type={show ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
                />
              </Field>
              {isSignUp && (
                <Field label="Confirm password">
                  <input
                    className={inputCls}
                    type={show ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={set('confirm')}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                  />
                </Field>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs text-mute">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
              Show password
            </label>

            {error && <div className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</div>}
            {notice && <div className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">{notice}</div>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-accent px-4 py-2.5 font-semibold text-bg hover:opacity-90 disabled:opacity-60"
            >
              {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-mute">
          Passwords are never stored by CAMPUS OS. They are protected by the authentication service.
        </p>
      </div>
    </div>
  )
}
