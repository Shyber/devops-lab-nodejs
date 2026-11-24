import { db } from './db.js'
import { getIncident, recordChange } from './cirsStore.js'
import { check, isFinal } from '../utils/validation.js'

// Additive migration: existing Lab5/Lab6 records remain untouched.
db.exec(`CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  is_internal INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
)`)

const commentView = row => ({
  id: row.id,
  incidentId: row.incident_id,
  authorId: row.author_id,
  text: row.text,
  isInternal: row.is_internal === 1,
  createdAt: row.created_at
})

export function listComments (incidentId, includeInternal) {
  return db.prepare(`SELECT * FROM comments WHERE incident_id = ?
    ${includeInternal ? '' : 'AND is_internal = 0'} ORDER BY id`).all(incidentId).map(commentView)
}

export function addComment (incidentId, authorId, content, isInternal) {
  const now = new Date().toISOString()
  const result = db.prepare('INSERT INTO comments (incident_id, author_id, text, is_internal, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(incidentId, authorId, content, isInternal ? 1 : 0, now)
  // Note contents deliberately never enter the public incident history.
  return commentView(db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid))
}

export const setPriority = db.transaction((incident, priority, actorId) => {
  if (incident.priority === priority) return incident
  db.prepare('UPDATE incidents SET priority = ?, updated_at = ? WHERE id = ?')
    .run(priority, new Date().toISOString(), incident.id)
  recordChange(incident.id, 'PRIORITY_CHANGED', incident.priority, priority, actorId)
  return getIncident(incident.id)
})

const transitions = {
  REPORTED: ['REJECTED'],
  ASSIGNED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
  REJECTED: []
}

export function validateTransition (incident, status) {
  check(!isFinal(incident.status), 409, 'FINAL_INCIDENT', 'Closed and Rejected incidents are read-only')
  check(transitions[incident.status].includes(status), 409, 'INVALID_TRANSITION', 'This status transition is not allowed')
  if (status === 'IN_PROGRESS') check(incident.assignedAnalystId !== null, 409, 'ASSIGNEE_REQUIRED', 'Assign an analyst before starting work')
}

export const setStatus = db.transaction((incident, status, reason, actorId) => {
  validateTransition(incident, status)
  db.prepare('UPDATE incidents SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, new Date().toISOString(), incident.id)
  if (status === 'RESOLVED' || status === 'REJECTED') addComment(incident.id, actorId, reason, false)
  recordChange(incident.id, 'STATUS_CHANGED', incident.status, status, actorId)
  return getIncident(incident.id)
})

const categoryView = row => ({ id: row.id, name: row.name, active: row.active === 1 })
export const categoryById = categoryId => {
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId)
  check(row, 404, 'CATEGORY_NOT_FOUND', 'Category not found')
  return categoryView(row)
}
export const categoryNameExists = (name, excludedId = -1) => Boolean(db.prepare('SELECT 1 FROM categories WHERE lower(name) = lower(?) AND id <> ?').get(name, excludedId))
export function createCategory (name) {
  const result = db.prepare('INSERT INTO categories (name, active) VALUES (?, 1)').run(name)
  return categoryById(Number(result.lastInsertRowid))
}
export function updateCategory (category, values) {
  const name = values.name === undefined ? category.name : values.name
  const active = values.active === undefined ? category.active : values.active
  db.prepare('UPDATE categories SET name = ?, active = ? WHERE id = ?').run(name, active ? 1 : 0, category.id)
  return categoryById(category.id)
}
