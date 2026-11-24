import express from 'express'
import crypto from 'node:crypto'
import { listAnalysts, getAnalyst, emailExists } from '../../data/cirsStore.js'
import { check, fields, id, text } from '../../utils/validation.js'
import { roles, createAccount } from '../../security/auth.js'

const router = express.Router()

router.get('/api/analysts', roles('ANALYST', 'ADMIN'), (req, res) => {
  fields(req.query, ['active'])
  const active = req.query.active === undefined ? 'true' : req.query.active
  check(['true', 'false', 'all'].includes(active), 400, 'INVALID_FILTER', 'active must be true, false or all')
  res.json(listAnalysts(active === 'all' ? 'all' : active === 'true'))
})

router.get('/api/analysts/:id', roles('ANALYST', 'ADMIN'), (req, res) => {
  const analyst = getAnalyst(id(req.params.id))
  check(analyst, 404, 'ANALYST_NOT_FOUND', 'Analyst not found')
  res.json(analyst)
})

router.post('/api/analysts', roles('ADMIN'), (req, res) => {
  fields(req.body, ['name', 'email', 'active'])
  const name = text(req.body.name, 'name', 2, 100)
  const email = text(req.body.email, 'email', 3, 254).toLowerCase()
  check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 400, 'INVALID_EMAIL', 'Provide a valid email address')
  const active = req.body.active === undefined ? true : req.body.active
  check(typeof active === 'boolean', 400, 'INVALID_INPUT', 'active must be a boolean')
  check(!emailExists(email), 409, 'DUPLICATE_EMAIL', 'Email already exists')
  // Preserve the directory payload; the admin sets a usable password via Users.
  const analyst = createAccount({ name, email, active, role: 'ANALYST', password: crypto.randomBytes(24).toString('hex') })
  res.location(`/api/analysts/${analyst.id}`).status(201).json(analyst)
})

export default router
