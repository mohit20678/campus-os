export default function Placeholder({ title, phase }) {
  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-mute">Coming in {phase}.</p>
    </div>
  )
}
