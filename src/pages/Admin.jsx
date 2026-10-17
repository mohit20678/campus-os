import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { PageHeader, Card, Tile, Loading } from '../components/ui'

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

function tally(rows, key) {
  const m = {}
  for (const r of rows) m[r[key]] = (m[r[key]] || 0) + 1
  return Object.entries(m).sort((a, b) => b[1] - a[1])
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-2 text-sm text-mute">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-line bg-bg px-3 py-1.5 text-ink">
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth()
  const [rows, setRows] = useState([])
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [branch, setBranch] = useState('All')
  const [year, setYear] = useState('All')

  useEffect(() => {
    if (!isAdmin || !supabase) return undefined
    let alive = true
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (!alive) return
        if (err) {
          setError(err.message)
          setState('error')
        } else {
          setRows(data || [])
          setState('ready')
        }
      })
    return () => {
      alive = false
    }
  }, [isAdmin])

  const branches = useMemo(() => ['All', ...Array.from(new Set(rows.map((r) => r.branch))).sort()], [rows])
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (branch === 'All' || r.branch === branch) &&
        (year === 'All' || String(r.year) === year) &&
        (needle === '' || [r.full_name, r.email, r.class_name].join(' ').toLowerCase().includes(needle))
    )
  }, [rows, q, branch, year])
  const byBranch = useMemo(() => tally(rows, 'branch'), [rows])
  const byYear = useMemo(() => tally(rows, 'year').sort((a, b) => Number(a[0]) - Number(b[0])), [rows])

  if (authLoading) return <Loading />
  if (!isAdmin) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="Admin" />
        <Card>
          <p className="text-sm text-mute">This page is only for the site admin.</p>
        </Card>
      </div>
    )
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const newThisWeek = rows.filter((r) => new Date(r.created_at).getTime() > weekAgo).length
  const maxBranch = byBranch.length ? byBranch[0][1] : 1

  const download = () => {
    const head = ['Name', 'Class', 'Branch', 'Year', 'Semester', 'Email', 'Joined']
    const lines = filtered.map((r) =>
      [r.full_name, r.class_name, r.branch, r.year, r.semester, r.email, new Date(r.created_at).toISOString().slice(0, 10)]
        .map(csvCell)
        .join(',')
    )
    const blob = new Blob([[head.map(csvCell).join(','), ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'campus-os-students.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Admin" subtitle="Everyone who has registered. Only you can see this page." />

      {state === 'loading' && <Loading text="Loading students…" />}
      {state === 'error' && (
        <div className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">Could not load students: {error}</div>
      )}

      {state === 'ready' && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Tile label="Registered students" value={rows.length} />
            <Tile label="Joined in last 7 days" value={newThisWeek} />
            <Tile label="Branches" value={byBranch.length} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="By branch">
              <div className="space-y-3">
                {byBranch.map(([name, n]) => (
                  <div key={name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{name}</span>
                      <span className="font-mono">{n}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-line">
                      <div className="h-1.5 rounded-full bg-accent" style={{ width: `${(n / maxBranch) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {byBranch.length === 0 && <p className="text-sm text-mute">No students yet.</p>}
              </div>
            </Card>
            <Card title="By year">
              <div className="space-y-2 text-sm">
                {byYear.map(([y, n]) => (
                  <div key={y} className="flex justify-between border-t border-line pt-2">
                    <span>Year {y}</span>
                    <span className="font-mono">{n}</span>
                  </div>
                ))}
                {byYear.length === 0 && <p className="text-mute">No students yet.</p>}
              </div>
            </Card>
          </div>

          <Card title={`Students (${filtered.length})`}>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email or class"
                className="w-64 rounded-lg border border-line bg-bg px-3 py-1.5 text-sm outline-none focus:border-accent"
              />
              <Select label="Branch" value={branch} onChange={setBranch} options={branches} />
              <Select label="Year" value={year} onChange={setYear} options={['All', '1', '2', '3', '4']} />
              <button onClick={download} className="ml-auto rounded-xl border border-line px-4 py-1.5 text-sm text-mute hover:text-ink">
                Download CSV
              </button>
            </div>
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-panel">
                  <tr className="text-left text-xs uppercase tracking-widest text-mute">
                    <th className="pb-2 font-normal">Name</th>
                    <th className="pb-2 font-normal">Class</th>
                    <th className="pb-2 font-normal">Branch</th>
                    <th className="pb-2 font-normal">Year / Sem</th>
                    <th className="pb-2 font-normal">Email</th>
                    <th className="pb-2 text-right font-normal">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-line">
                      <td className="py-2">
                        {r.full_name}
                        {r.role === 'admin' && <span className="ml-2 rounded-full border border-accent/50 px-2 py-0.5 text-[10px] text-accent">admin</span>}
                      </td>
                      <td className="py-2 text-mute">{r.class_name}</td>
                      <td className="py-2 text-mute">{r.branch}</td>
                      <td className="py-2 font-mono text-mute">Y{r.year} / S{r.semester}</td>
                      <td className="py-2 text-mute">{r.email}</td>
                      <td className="py-2 text-right font-mono text-mute">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-mute">No students match.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
