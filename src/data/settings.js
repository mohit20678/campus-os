// Small settings store (saved in the browser). Used by Settings, Profile and the data generator.
const KEY = 'campus-os-settings'
export const DEFAULTS = { threshold: 30, refresh: 5, name: 'Campus Admin', role: 'Principal' }

let cache = null

export function getSettings() {
  if (!cache) {
    try {
      cache = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
    } catch {
      cache = { ...DEFAULTS }
    }
  }
  return cache
}

export function saveSettings(patch) {
  cache = { ...getSettings(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* storage blocked: keep in memory only */
  }
  return cache
}

export function resetSettings() {
  cache = { ...DEFAULTS }
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  return cache
}