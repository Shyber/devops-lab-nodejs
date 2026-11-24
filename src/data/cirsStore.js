// CIRS data access on top of SQLite. Routes call these functions instead of
// touching SQL directly. All example data is fictional.
import { db } from './db.js'
import { check, id } from '../utils/validation.js'

export { db }
export const demoReporter = { id: 100, name: 'Demo Campus User', role: 'USER' }
export const demoOperator = { id: 1, name: 'Maya Chen', role: 'ANALYST' }

// ---------- Row mapping ----------

const toAnalyst = row => row && { id: row.id, name: row.name, email: row.email, role: row.role, active: row.active === 1 }
const toCategory = row => row && { id: row.id, name: row.name, active: row.active === 1 }
const toHistory = row => ({
  action: row.action,
  actorId: row.actor_id,
  oldValue: JSON.parse(row.old_value),
  newValue: JSON.parse(row.new_value),
  at: row.at
})
const historyOf = incidentId => db
  .prepare('SELECT * FROM incident_history WHERE incident_id = ? ORDER BY id')
  .all(incidentId).map(toHistory)
const toIncident = row => row && {
  id: row.id,
  title: row.title,
  description: row.description,
  categoryId: row.category_id,
  reporterId: row.reporter_id,
  status: row.status,
  priority: row.priority,
  assignedAnalystId: row.assigned_analyst_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  history: historyOf(row.id)
}

// ---------- Fixtures ----------

function seed () {
  const analysts = [
    [1, 'Maya Chen', 'maya.chen@example.test', 1],
    [2, 'Leo Martin', 'leo.martin@example.test', 1],
    [3, 'Nora Silva', 'nora.silva@example.test', 0]
  ]
  const insertAnalyst = db.prepare("INSERT INTO analysts (id, name, email, role, active) VALUES (?, ?, ?, 'ANALYST', ?)")
  analysts.forEach(row => insertAnalyst.run(...row))

  // Fictional presence records for SCRUM-14, not measured login sessions.
  const insertPresence = db.prepare('INSERT INTO analyst_presence (analyst_id, online) VALUES (?, ?)')
  ;[[1, 1], [2, 0], [3, 1]].forEach(row => insertPresence.run(...row))

  const insertCategory = db.prepare('INSERT INTO categories (id, name, active) VALUES (?, ?, ?)')
  ;['Phishing', 'Suspicious Link', 'Compromised Account', 'Malware', 'Other']
    .forEach((name, index) => insertCategory.run(index + 1, name, 1))
  insertCategory.run(6, 'Retired training category', 0)

  const examples = [
    ['Suspicious campus email', 1, 'REPORTED', 'MEDIUM', null],
    ['Unexpected account access', 3, 'ASSIGNED', 'HIGH', 1],
    ['Malware warning in training VM', 4, 'IN_PROGRESS', 'CRITICAL', 2],
    ['Closed classroom demonstration', 5, 'CLOSED', 'LOW', 1],
    ['Rejected duplicate training report', 2, 'REJECTED', 'MEDIUM', null],
    ['Resolved training device incident', 4, 'RESOLVED', 'CRITICAL', 1]
  ]
  const insertIncident = db.prepare(`INSERT INTO incidents
    (id, title, description, category_id, reporter_id, status, priority, assigned_analyst_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  examples.forEach(([title, categoryId, status, priority, analystId], index) => {
    const at = `2026-11-01T10:0${index}:00.000Z`
    // Seed snapshots do not claim a recorded investigation history.
    insertIncident.run(index + 1, title, 'Fictional incident used for the local CIRS demonstration.',
      categoryId, demoReporter.id, status, priority, analystId, at, at)
  })
}

/** Deletes every record and restores the demonstration fixtures. */
export const resetStore = db.transaction(() => {
  if (db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'comments'").get()) db.exec('DELETE FROM comments')
  db.exec(`DELETE FROM incident_history; DELETE FROM incidents; DELETE FROM analyst_presence;
    DELETE FROM analysts; DELETE FROM categories;`)
  seed()
})

/** Seeds an empty database (first start); keeps existing data otherwise. */
export function ensureSeeded () {
  if (db.prepare('SELECT COUNT(*) AS n FROM categories').get().n === 0) resetStore()
}

// ---------- Analysts ----------

export function listAnalysts (active) {
  if (active === 'all') return db.prepare('SELECT * FROM analysts ORDER BY id').all().map(toAnalyst)
  return db.prepare('SELECT * FROM analysts WHERE active = ? ORDER BY id').all(active ? 1 : 0).map(toAnalyst)
}

export const getAnalyst = analystId => toAnalyst(db.prepare('SELECT * FROM analysts WHERE id = ?').get(analystId))

export const emailExists = email => Boolean(db.prepare('SELECT 1 FROM analysts WHERE email = ?').get(email))

export function createAnalyst ({ name, email, active }) {
  const { lastInsertRowid } = db
    .prepare("INSERT INTO analysts (name, email, role, active) VALUES (?, ?, 'ANALYST', ?)")
    .run(name, email, active ? 1 : 0)
  return getAnalyst(Number(lastInsertRowid))
}

// ---------- Categories ----------

export const listActiveCategories = () => db.prepare('SELECT * FROM categories WHERE active = 1 ORDER BY id').all().map(toCategory)
export const getCategory = categoryId => toCategory(db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId))

// ---------- Incidents ----------

/** Lists incidents newest first; every given filter is combined with AND. */
export function listIncidents ({ status, priority, categoryId, category } = {}) {
  const where = []
  const params = []
  if (status !== undefined) { where.push('i.status = ?'); params.push(status) }
  if (priority !== undefined) { where.push('i.priority = ?'); params.push(priority) }
  if (categoryId !== undefined) { where.push('i.category_id = ?'); params.push(categoryId) }
  if (category !== undefined) { where.push('c.name = ?'); params.push(category) }
  const sql = `SELECT i.* FROM incidents i JOIN categories c ON c.id = i.category_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY i.created_at DESC, i.id DESC`
  return db.prepare(sql).all(...params).map(toIncident)
}

export const getIncident = incidentId => toIncident(db.prepare('SELECT * FROM incidents WHERE id = ?').get(incidentId))

/** Validates the ID, then returns the incident or throws a 404. */
export function findIncident (value) {
  const incident = getIncident(id(value))
  check(incident, 404, 'INCIDENT_NOT_FOUND', 'Incident not found')
  return incident
}

export function recordChange (incidentId, action, oldValue, newValue, actorId = demoOperator.id) {
  db.prepare('INSERT INTO incident_history (incident_id, action, actor_id, old_value, new_value, at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(incidentId, action, actorId, JSON.stringify(oldValue), JSON.stringify(newValue), new Date().toISOString())
}

export const createIncident = db.transaction(({ title, description, categoryId }, reporterId = demoReporter.id) => {
  const now = new Date().toISOString()
  const { lastInsertRowid } = db.prepare(`INSERT INTO incidents
    (title, description, category_id, reporter_id, status, priority, assigned_analyst_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'REPORTED', 'MEDIUM', NULL, ?, ?)`)
    .run(title, description, categoryId, reporterId, now, now)
  const incidentId = Number(lastInsertRowid)
  recordChange(incidentId, 'CREATED', null, 'REPORTED', reporterId)
  return getIncident(incidentId)
})

/** Assigns an analyst; a first assignment also moves REPORTED to ASSIGNED. */
export const assignIncident = db.transaction((incident, analystId, actorId = demoOperator.id) => {
  if (incident.assignedAnalystId === analystId) return incident
  recordChange(incident.id, 'ASSIGNED', incident.assignedAnalystId, analystId, actorId)
  let status = incident.status
  if (status === 'REPORTED') {
    recordChange(incident.id, 'STATUS_CHANGED', 'REPORTED', 'ASSIGNED', actorId)
    status = 'ASSIGNED'
  }
  db.prepare('UPDATE incidents SET assigned_analyst_id = ?, status = ?, updated_at = ? WHERE id = ?')
    .run(analystId, status, new Date().toISOString(), incident.id)
  return getIncident(incident.id)
})

const editableColumns = { title: 'title', description: 'description', categoryId: 'category_id' }

/** Updates the reported content; records one UPDATED entry with the changed fields only. */
export const updateIncident = db.transaction((incident, changes, actorId = demoReporter.id) => {
  const changed = Object.keys(changes).filter(key => incident[key] !== changes[key])
  if (changed.length === 0) return incident
  const oldValue = Object.fromEntries(changed.map(key => [key, incident[key]]))
  const newValue = Object.fromEntries(changed.map(key => [key, changes[key]]))
  const assignments = changed.map(key => `${editableColumns[key]} = @${key}`).join(', ')
  db.prepare(`UPDATE incidents SET ${assignments}, updated_at = @now WHERE id = @id`)
    .run({ ...newValue, now: new Date().toISOString(), id: incident.id })
  recordChange(incident.id, 'UPDATED', oldValue, newValue, actorId)
  return getIncident(incident.id)
})

/** Deletes an incident and its history (ON DELETE CASCADE). */
export const deleteIncident = incidentId => db.prepare('DELETE FROM incidents WHERE id = ?').run(incidentId).changes === 1

export const listAssignedIncidents = () => db
  .prepare('SELECT * FROM incidents WHERE assigned_analyst_id IS NOT NULL ORDER BY id')
  .all().map(toIncident)

// ---------- Metrics ----------

export function metricCounts () {
  const open = "status NOT IN ('CLOSED', 'REJECTED')"
  return {
    activeIncidents: db.prepare(`SELECT COUNT(*) AS n FROM incidents WHERE ${open}`).get().n,
    criticalAlerts: db.prepare(`SELECT COUNT(*) AS n FROM incidents WHERE ${open} AND priority = 'CRITICAL'`).get().n,
    onlineAnalysts: db.prepare(`SELECT COUNT(*) AS n FROM analysts a JOIN analyst_presence p ON p.analyst_id = a.id
      WHERE a.active = 1 AND a.role = 'ANALYST' AND p.online = 1`).get().n
  }
}

ensureSeeded()
