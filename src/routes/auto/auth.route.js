import express from 'express'
import { fields } from '../../utils/validation.js'
import { requireAuth, signIn, signOut } from '../../security/auth.js'

const router = express.Router()
router.post('/api/auth/login', (req, res) => {
  fields(req.body, ['email', 'password'])
  res.json(signIn(req.body.email, req.body.password))
})
router.get('/api/auth/me', requireAuth, (req, res) => res.json(req.user))
router.post('/api/auth/logout', requireAuth, (req, res) => {
  signOut(req.sessionId)
  res.status(204).end()
})
export default router
