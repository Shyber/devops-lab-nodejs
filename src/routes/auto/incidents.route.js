import express from 'express'
import { listIncidents, getCategory, createIncident, updateIncident, deleteIncident } from '../../data/cirsStore.js'
import { check, fields, id, text, statuses, priorities, isFinal } from '../../utils/validation.js'
import { roles } from '../../security/auth.js'
import { accessibleIncident } from '../../security/access.js'

const router = express.Router()

router.get('/api/incidents', roles('ANALYST', 'ADMIN'), (req, res) => {
  fields(req.query, ['status', 'priority', 'category', 'categoryId'])
  const { status, priority } = req.query
  if (status !== undefined) check(statuses.includes(status), 400, 'INVALID_STATUS', 'Unknown status')
  if (priority !== undefined) check(priorities.includes(priority), 400, 'INVALID_PRIORITY', 'Unknown priority')
  const categoryId = req.query.categoryId === undefined ? undefined : id(req.query.categoryId)
  check(req.query.category === undefined || categoryId === undefined, 400, 'INVALID_FILTER', 'Use category or categoryId, not both')
  const category = req.query.category === undefined ? undefined : text(req.query.category, 'category', 1, 100)
  res.json(listIncidents({ status, priority, categoryId, category }))
})

router.get('/api/incidents/my', (req, res) => {
  fields(req.query, [])
  res.json(listIncidents().filter(item => item.reporterId === req.user.id))
})
router.get('/api/incidents/:id', (req, res) => res.json(accessibleIncident(req, req.params.id)))

const editable = ['title', 'description', 'categoryId']
const rules = {
  title: value => text(value, 'title', 5, 120),
  description: value => text(value, 'description', 20, 5000),
  categoryId: value => {
    const categoryId = id(value)
    const category = getCategory(categoryId)
    check(category, 404, 'CATEGORY_NOT_FOUND', 'Category not found')
    check(category.active, 400, 'INACTIVE_CATEGORY', 'Choose an active category')
    return categoryId
  }
}

router.post('/api/incidents', roles('USER'), (req, res) => {
  fields(req.body, editable)
  const values = Object.fromEntries(editable.map(key => [key, rules[key](req.body[key])]))
  const incident = createIncident(values, req.user.id)
  res.location(`/api/incidents/${incident.id}`).status(201).json(incident)
})

// Edits the reported content only. Priority, status and assignment have their own workflow.
router.put('/api/incidents/:id', (req, res) => {
  const incident = accessibleIncident(req, req.params.id)
  fields(req.body, editable)
  const keys = Object.keys(req.body)
  check(keys.length > 0, 400, 'INVALID_INPUT', `Provide at least one of: ${editable.join(', ')}`)
  const changes = Object.fromEntries(keys.map(key => [key, rules[key](req.body[key])]))
  check(!isFinal(incident.status), 409, 'FINAL_INCIDENT', 'Closed and Rejected incidents are read-only')
  res.json(updateIncident(incident, changes, req.user.id))
})

// A report can be withdrawn only before the IT team starts handling it.
router.delete('/api/incidents/:id', (req, res) => {
  const incident = accessibleIncident(req, req.params.id)
  check(incident.status === 'REPORTED' && incident.assignedAnalystId === null, 409, 'INCIDENT_LOCKED',
    'Only unassigned Reported incidents can be deleted')
  deleteIncident(incident.id)
  res.status(204).end()
})

export default router
