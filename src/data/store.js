/**
 * In-memory "database" shared by all routes.
 * Replace by MongoDB later (the `mongodb` dependency is already installed).
 */
export const doctors = [
  { id: 1, name: 'Dr. Sarah Lee', specialty: 'Cardiology' },
  { id: 2, name: 'Dr. Amir Khan', specialty: 'Pediatrics' }
]

export const patients = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'John', age: 45 }
]

export const appointments = []

/** Next id = highest existing id + 1 (safer than array.length + 1). */
export function nextId (collection) {
  return collection.reduce((max, item) => Math.max(max, item.id), 0) + 1
}
