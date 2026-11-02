// Local teaching data only. Restarting the server clears all changes.
export const statuses = ['Reported', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected']
export const priorities = ['Low', 'Medium', 'High', 'Critical']
export const store = { categories: [], incidents: [] }

export function resetStore () {
  store.categories.splice(0, store.categories.length,
    { id: 1, name: 'Phishing', active: true },
    { id: 2, name: 'Account access', active: true })
  store.incidents.length = 0
}

export function fail (status, message) {
  const error = new Error(message)
  error.status = status
  throw error
}

export function textField (value, min, max) {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max
}

export function findIncident (id) {
  const incident = store.incidents.find(item => String(item.id) === id)
  if (!incident) fail(404, 'Incident not found')
  return incident
}

resetStore()
