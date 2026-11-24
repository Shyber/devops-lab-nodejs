import express from 'express'
import { roles } from '../../security/auth.js'
import { accessibleIncident } from '../../security/access.js'
import { check, fields, id, text, priorities, statuses, isFinal } from '../../utils/validation.js'
import {
  listComments, addComment, setPriority, setStatus,
  categoryById, categoryNameExists, createCategory, updateCategory
} from '../../data/workflow.js'

const router = express.Router()
const it = roles('ANALYST', 'ADMIN')
const admin = roles('ADMIN')
const isIT = user => user.role === 'ANALYST' || user.role === 'ADMIN'

router.get('/api/incidents/:id/comments', (req, res) => {
  fields(req.query, [])
  const incident = accessibleIncident(req, req.params.id)
  res.json(listComments(incident.id, isIT(req.user)))
})

router.post('/api/incidents/:id/comments', (req, res) => {
  const incident = accessibleIncident(req, req.params.id)
  fields(req.body, ['text', 'isInternal'])
  const content = text(req.body.text, 'text', 1, 2000)
  const internal = req.body.isInternal === undefined ? false : req.body.isInternal
  check(typeof internal === 'boolean', 400, 'INVALID_INPUT', 'isInternal must be a boolean')
  check(!internal || isIT(req.user), 403, 'FORBIDDEN', 'Only IT roles can add internal notes')
  check(!isFinal(incident.status), 409, 'FINAL_INCIDENT', 'Closed and Rejected incidents are read-only')
  const comment = addComment(incident.id, req.user.id, content, internal)
  res.status(201).json(comment)
})

router.get('/api/incidents/:id/history', (req, res) => {
  fields(req.query, [])
  res.json(accessibleIncident(req, req.params.id).history)
})

router.patch('/api/incidents/:id/priority', it, (req, res) => {
  const incident = accessibleIncident(req, req.params.id)
  fields(req.body, ['priority'])
  check(priorities.includes(req.body.priority), 400, 'INVALID_PRIORITY', 'Unknown priority')
  check(!isFinal(incident.status), 409, 'FINAL_INCIDENT', 'Closed and Rejected incidents are read-only')
  res.json(setPriority(incident, req.body.priority, req.user.id))
})

router.patch('/api/incidents/:id/status', it, (req, res) => {
  const incident = accessibleIncident(req, req.params.id)
  fields(req.body, ['status', 'reason'])
  check(statuses.includes(req.body.status), 400, 'INVALID_STATUS', 'Unknown status')
  const needsReason = req.body.status === 'RESOLVED' || req.body.status === 'REJECTED'
  const reason = needsReason || req.body.reason !== undefined ? text(req.body.reason, 'reason', 1, 2000) : undefined
  res.json(setStatus(incident, req.body.status, reason, req.user.id))
})

router.post('/api/categories', admin, (req, res) => {
  fields(req.body, ['name'])
  const name = text(req.body.name, 'name', 1, 100)
  check(!categoryNameExists(name), 409, 'DUPLICATE_CATEGORY', 'Category name already exists')
  const category = createCategory(name)
  res.location(`/api/categories/${category.id}`).status(201).json(category)
})

router.put('/api/categories/:id', admin, (req, res) => {
  const category = categoryById(id(req.params.id))
  fields(req.body, ['name', 'active'])
  check(Object.keys(req.body).length > 0, 400, 'INVALID_INPUT', 'Provide name or active')
  const values = { ...req.body }
  if (values.name !== undefined) {
    values.name = text(values.name, 'name', 1, 100)
    check(!categoryNameExists(values.name, category.id), 409, 'DUPLICATE_CATEGORY', 'Category name already exists')
  }
  if (values.active !== undefined) check(typeof values.active === 'boolean', 400, 'INVALID_INPUT', 'active must be a boolean')
  res.json(updateCategory(category, values))
})

export default router
