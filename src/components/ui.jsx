export const STATUS_HEX = { low: '#5cc8ff', normal: '#3ddc97', busy: '#ffb84d', crowded: '#ff5d6c' }
export const STATUS_LABEL = { low: 'Low activity', normal: 'Normal', busy: 'Busy', crowded: 'Crowded' }

export const TIP = {
  background: 'var(--color-panel)',
  border: '1px solid var(--color-line)',
  borderRadius: 12,
  color: 'var(--color-ink)',
  fontSize: 12,
}

export function PageHeader({ title, subtitle, right }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-mute">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export function Card({ title, subtitle, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-line bg-panel p-6 ${className}`}>
      {title && <h2 className="font-display text-lg font-bold">{title}</h2>}
      {subtitle && <p className="mb-4 text-xs text-mute">{subtitle}</p>}
      {!subtitle && title && <div className="mb-4" />}
      {children}
    </section>
  )
}

export function Tile({ label, value, sub, subCls = 'text-mute', warn }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <div className="text-xs uppercase tracking-widest text-mute">{label}</div>
      <div className={`mt-1 font-display text-4xl font-bold ${warn ? 'text-warn' : ''}`}>{value}</div>
      {sub && <div className={`mt-1 text-sm ${subCls}`}>{sub}</div>}
    </div>
  )
}

export function Tabs({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={
            'rounded-lg border px-3 py-1.5 text-sm transition-colors ' +
            (o === value ? 'border-accent bg-accent/15 text-ink' : 'border-line text-mute hover:text-ink')
          }
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export function Loading({ text = 'Loading…' }) {
  return <div className="p-8 text-mute">{text}</div>
}