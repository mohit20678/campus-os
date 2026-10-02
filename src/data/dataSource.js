import { generateSnapshot } from './generator'

// The ONE place the app gets campus data from.
// Today: simulated demo data. Later: replace with Supabase, sensors or college APIs.
export async function getSnapshot(date = new Date()) {
  return generateSnapshot(date)
}