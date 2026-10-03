import { useState } from 'react'
import { buildReport, reportToText, addDays } from '../data/analysis'
import { PageHeader, Card, Tabs } from '../components/ui'

const WHICH = ['Today', 'Yesterday']

export default function Reports() {
  const [which, setWhich] = useState('Today')
  const [report, setReport] = useState(() => buildReport(new Date()))
  const [copied, setCopied] = useState(false)

  const generate = (w = which) => {
    setReport(buildReport(w === 'Today' ? new Date() : addDays(new Date(), -1)))
    setCopied(false)
  }

  const download = () => {
    const blob = new Blob([reportToText(report)], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campus-report-${which.toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reportToText(report))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Reports" subtitle="A plain-language summary of the day, written from the numbers." />

      <div className="flex flex-wrap items-center gap-4">
        <Tabs
          options={WHICH}
          value={which}
          onChange={(w) => {
            setWhich(w)
            generate(w)
          }}
        />
        <button onClick={() => generate()} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg hover:opacity-90">
          Generate report
        </button>
        <button onClick={copy} className="rounded-xl border border-line px-4 py-2 text-sm text-mute hover:text-ink">
          {copied ? 'Copied' : 'Copy text'}
        </button>
        <button onClick={download} className="rounded-xl border border-line px-4 py-2 text-sm text-mute hover:text-ink">
          Download .txt
        </button>
      </div>

      <article className="rounded-2xl border border-line bg-panel p-8">
        <div className="text-xs uppercase tracking-widest text-accent">CAMPUS OS · HITAM</div>
        <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">{report.title}</h2>
        <p className="font-mono text-xs text-mute">{report.dateLabel}</p>

        <div className="my-6 grid gap-3 sm:grid-cols-3">
          {report.stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-line px-4 py-3">
              <div className="text-xs uppercase tracking-widest text-mute">{s.label}</div>
              <div className="font-display text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3 text-[15px] leading-relaxed">
          {report.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-warn/30 bg-warn/5 p-4">
          <div className="text-xs uppercase tracking-widest text-warn">Key insight</div>
          <p className="mt-1 font-semibold">⚠ {report.keyInsight}</p>
          <p className="mt-2 text-sm text-mute">{report.recommendation}</p>
        </div>

        <p className="mt-6 text-xs text-mute">{report.disclaimer}</p>
      </article>

      <Card title="What the report uses" subtitle="Everything above is computed, nothing is typed in by hand.">
        <p className="text-sm text-mute">
          Crowd and pulse history, anomaly episodes, energy against expected levels, and the problem log. When real data replaces the demo data, this report updates by itself.
        </p>
      </Card>
    </div>
  )
}