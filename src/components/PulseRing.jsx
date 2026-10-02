export default function PulseRing({ value }) {
  const r = 88
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 200 200" className="h-56 w-56 -rotate-90">
      <circle cx="100" cy="100" r={r} fill="none" stroke="var(--color-line)" strokeWidth="10" />
      <circle
        cx="100"
        cy="100"
        r={r}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  )
}