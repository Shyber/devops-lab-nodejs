import express from 'express'
import { store, nextId } from '../../data/cirsStore.js'
import { check, fields, id, text } from '../../utils/validation.js'

const router = express.Router()

router.get('/api/analysts', (req, res) => {
  fields(req.query, ['active'])
  const active = req.query.active === undefined ? 'true' : req.query.active
  check(['true', 'false', 'all'].includes(active), 400, 'INVALID_FILTER', 'active must be true, false or all')
  res.json(store.analysts.filter(item => active === 'all' || item.active === (active === 'true')))
})

router.get('/api/analysts/:id', (req, res) => {
  const analystId = id(req.params.id)
  const analyst = store.analysts.find(item => item.id === analystId)
  check(analyst, 404, 'ANALYST_NOT_FOUND', 'Analyst not found')
  res.json(analyst)
})

router.post('/api/analysts', (req, res) => {
  fields(req.body, ['name', 'email', 'active'])
  const name = text(req.body.name, 'name', 2, 100)
  const email = text(req.body.email, 'email', 3, 254).toLowerCase()
  check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 400, 'INVALID_EMAIL', 'Provide a valid email address')
  const active = req.body.active === undefined ? true : req.body.active
  check(typeof active === 'boolean', 400, 'INVALID_INPUT', 'active must be a boolean')
  check(!store.analysts.some(item => item.email === email), 409, 'DUPLICATE_EMAIL', 'Email already exists')
  // This is a demonstration analyst directory, not account registration.
  const analyst = { id: nextId(store.analysts), name, email, role: 'ANALYST', active }
  store.analysts.push(analyst)
  res.location(`/api/analysts/${analyst.id}`).status(201).json(analyst)
})

export default router
