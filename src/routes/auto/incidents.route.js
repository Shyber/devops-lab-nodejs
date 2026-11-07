import express from 'express'
import { store, nextId, findIncident, demoReporter, recordChange } from '../../data/cirsStore.js'
import { check, fields, id, text, statuses, priorities } from '../../utils/validation.js'

const router = express.Router()

router.get('/api/incidents', (req, res) => {
  fields(req.query, ['status', 'priority', 'category', 'categoryId'])
  const { status, priority } = req.query
  if (status !== undefined) check(statuses.includes(status), 400, 'INVALID_STATUS', 'Unknown status')
  if (priority !== undefined) check(priorities.includes(priority), 400, 'INVALID_PRIORITY', 'Unknown priority')
  const categoryId = req.query.categoryId === undefined ? undefined : id(req.query.categoryId)
  check(req.query.category === undefined || categoryId === undefined, 400, 'INVALID_FILTER', 'Use category or categoryId, not both')
  const category = req.query.category === undefined ? undefined : text(req.query.category, 'category', 1, 100)
  const result = store.incidents.filter(item =>
    (status === undefined || item.status === status) &&
    (priority === undefined || item.priority === priority) &&
    (categoryId === undefined || item.categoryId === categoryId) &&
    (category === undefined || store.categories.find(record => record.id === item.categoryId)?.name === category))
  res.json([...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id))
})

router.get('/api/incidents/:id', (req, res) => res.json(findIncident(req.params.id)))

router.post('/api/incidents', (req, res) => {
  fields(req.body, ['title', 'description', 'categoryId'])
  const title = text(req.body.title, 'title', 5, 120)
  const description = text(req.body.description, 'description', 20, 5000)
  const categoryId = id(req.body.categoryId)
  const category = store.categories.find(item => item.id === categoryId)
  check(category, 404, 'CATEGORY_NOT_FOUND', 'Category not found')
  check(category.active, 400, 'INACTIVE_CATEGORY', 'Choose an active category')
  const now = new Date().toISOString()
  const incident = {
    id: nextId(store.incidents),
    title,
    description,
    categoryId,
    reporterId: demoReporter.id,
    status: 'REPORTED',
    priority: 'MEDIUM',
    assignedAnalystId: null,
    createdAt: now,
    updatedAt: now,
    history: []
  }
  recordChange(incident, 'CREATED', null, 'REPORTED', demoReporter.id)
  store.incidents.push(incident)
  res.location(`/api/incidents/${incident.id}`).status(201).json(incident)
})

export default router
