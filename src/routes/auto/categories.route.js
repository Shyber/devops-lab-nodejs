import express from 'express'
import { listActiveCategories } from '../../data/cirsStore.js'
import { db } from '../../data/db.js'
import { check, fields } from '../../utils/validation.js'

const router = express.Router()
router.get('/api/categories', (req, res) => {
  fields(req.query, ['active'])
  if (req.query.active === undefined) return res.json(listActiveCategories())
  check(req.query.active === 'all', 400, 'INVALID_FILTER', 'Only active=all is supported')
  check(req.user.role === 'ADMIN', 403, 'FORBIDDEN', 'Only administrators can list inactive categories')
  res.json(db.prepare('SELECT * FROM categories ORDER BY id').all().map(row => ({ ...row, active: row.active === 1 })))
})
export default router
