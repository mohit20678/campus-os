// What-If model. Simple, explainable formulas: utilisation = demand / capacity.
export const BASE = { students: 3241, classrooms: 64, canteens: 1, parking: 620, library: 800, labs: 18 }

export const ASSUMPTIONS = [
  'About 72% of students are present at the busiest hour; each classroom seats 60.',
  'A canteen serves about 1,125 people during the lunch rush; 30% of students eat there.',
  'About 15% of students bring a vehicle to campus.',
  'About 18% of students use the library at peak; each lab seats 40 and 14% of students are in a lab at peak.',
  'Energy = 35% fixed load + 40% scales with students + 25% scales with classrooms.',
]

const CFG = {
  presence: 0.72,
  classSeats: 60,
  canteenCap: 1125,
  canteenShare: 0.3,
  vehicleShare: 0.15,
  libraryShare: 0.18,
  labSeats: 40,
  labShare: 0.14,
}

export const METRICS = [
  { key: 'classrooms', label: 'Classroom crowding', fix: 'add classrooms or spread timetable slots' },
  { key: 'canteen', label: 'Canteen load', fix: 'open another canteen or counter, or stagger lunch breaks' },
  { key: 'parking', label: 'Parking pressure', fix: 'add parking spaces or encourage bus and carpool use' },
  { key: 'library', label: 'Library demand', fix: 'add reading seats or extend opening hours' },
  { key: 'labs', label: 'Lab load', fix: 'add lab slots or lab capacity' },
  { key: 'energy', label: 'Energy demand', fix: 'plan efficiency measures and smarter room scheduling' },
]

export function metrics(s) {
  return {
    classrooms: ((s.students * CFG.presence) / (s.classrooms * CFG.classSeats)) * 100,
    canteen: ((s.students * CFG.canteenShare) / (s.canteens * CFG.canteenCap)) * 100,
    parking: ((s.students * CFG.vehicleShare) / s.parking) * 100,
    library: ((s.students * CFG.libraryShare) / s.library) * 100,
    labs: ((s.students * CFG.labShare) / (s.labs * CFG.labSeats)) * 100,
    energy: (0.35 + 0.4 * (s.students / BASE.students) + 0.25 * (s.classrooms / BASE.classrooms)) * 100,
  }
}

export const levelOf = (v) => (v < 70 ? 'ok' : v < 90 ? 'warn' : 'bad')

export function simulate(scenario) {
  const now = metrics(BASE)
  const next = metrics(scenario)
  const rows = METRICS.map((m) => ({
    ...m,
    now: Math.round(now[m.key]),
    next: Math.round(next[m.key]),
    change: Math.round((next[m.key] / now[m.key] - 1) * 100),
  }))
  const advice = rows
    .filter((r) => r.key !== 'energy' && r.next >= 90)
    .sort((a, b) => b.next - a.next)
    .map((r) =>
      r.next > 100
        ? `${r.label} would exceed capacity (${r.next}%). Consider: ${r.fix}.`
        : `${r.label} would be close to the limit (${r.next}%). Consider: ${r.fix}.`
    )
  return { rows, advice }
}