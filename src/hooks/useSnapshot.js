import { useEffect, useState } from 'react'
import { getSnapshot } from '../data/dataSource'
import { getSettings } from '../data/settings'

// Live campus snapshot, refreshed on the interval chosen in Settings.
export function useSnapshot() {
  const [snap, setSnap] = useState(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const s = await getSnapshot()
      if (alive) setSnap(s)
    }
    load()
    const t = setInterval(load, getSettings().refresh * 1000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  return snap
}