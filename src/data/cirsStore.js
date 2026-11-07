// Fictional Lab5 data. Restarting the server restores these fixtures.
// Accounts, authentication, PostgreSQL and full history belong to later work.
import { check, id } from '../utils/validation.js'

export const store = { analysts: [], categories: [], incidents: [], presence: [] }
export const demoReporter = { id: 100, name: 'Demo Campus User', role: 'USER' }
export const demoOperator = { id: 1, name: 'Maya Chen', role: 'ANALYST' }

export function resetStore () {
  store.analysts = [
    { id: 1, name: 'Maya Chen', email: 'maya.chen@example.test', role: 'ANALYST', active: true },
    { id: 2, name: 'Leo Martin', email: 'leo.martin@example.test', role: 'ANALYST', active: true },
    { id: 3, name: 'Nora Silva', email: 'nora.silva@example.test', role: 'ANALYST', active: false }
  ]
  // Fictional presence records for SCRUM-14, not measured login sessions.
  store.presence = [{ analystId: 1, online: true }, { analystId: 2, online: false }, { analystId: 3, online: true }]
  store.categories = ['Phishing', 'Suspicious Link', 'Compromised Account', 'Malware', 'Other']
    .map((name, index) => ({ id: index + 1, name, active: true }))
  store.categories.push({ id: 6, name: 'Retired training category', active: false })
  const examples = [
    ['Suspicious campus email', 1, 'REPORTED', 'MEDIUM', null],
    ['Unexpected account access', 3, 'ASSIGNED', 'HIGH', 1],
    ['Malware warning in training VM', 4, 'IN_PROGRESS', 'CRITICAL', 2],
    ['Closed classroom demonstration', 5, 'CLOSED', 'LOW', 1],
    ['Rejected duplicate training report', 2, 'REJECTED', 'MEDIUM', null],
    ['Resolved training device incident', 4, 'RESOLVED', 'CRITICAL', 1]
  ]
  store.incidents = examples.map(([title, categoryId, status, priority, assignedAnalystId], index) => ({
    id: index + 1,
    title,
    description: 'Fictional incident used for the local CIRS Lab5 demonstration.',
    categoryId,
    reporterId: demoReporter.id,
    status,
    priority,
    assignedAnalystId,
    createdAt: `2026-11-01T10:0${index}:00.000Z`,
    updatedAt: `2026-11-01T10:0${index}:00.000Z`,
    history: [] // Seed snapshots do not claim a recorded investigation history.
  }))
}

export const nextId = records => Math.max(0, ...records.map(record => record.id)) + 1

export function findIncident (value) {
  const incidentId = id(value)
  const incident = store.incidents.find(item => item.id === incidentId)
  check(incident, 404, 'INCIDENT_NOT_FOUND', 'Incident not found')
  return incident
}

export function recordChange (incident, action, oldValue, newValue, actorId = demoOperator.id) {
  incident.history.push({ action, actorId, oldValue, newValue, at: new Date().toISOString() })
}

resetStore()
