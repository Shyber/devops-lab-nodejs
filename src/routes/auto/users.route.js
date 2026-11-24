import express from 'express'
import { check, fields, id } from '../../utils/validation.js'
import { requireAuth, roles, listAccounts, accountById, publicAccount, createAccount, updateAccount } from '../../security/auth.js'

const router = express.Router()
router.use('/api/users', requireAuth, roles('ADMIN'))
router.get('/api/users', (req, res) => res.json(listAccounts()))
router.get('/api/users/:id', (req, res) => {
  const user = accountById(id(req.params.id))
  check(user, 404, 'ACCOUNT_NOT_FOUND', 'Account not found')
  res.json(publicAccount(user))
})
router.post('/api/users', (req, res) => {
  fields(req.body, ['name', 'email', 'password', 'role', 'active'])
  const user = createAccount(req.body)
  res.location(`/api/users/${user.id}`).status(201).json(user)
})
router.put('/api/users/:id', (req, res) => {
  fields(req.body, ['name', 'email', 'password', 'role', 'active'])
  check(Object.keys(req.body).length > 0, 400, 'INVALID_INPUT', 'Provide at least one account field')
  res.json(updateAccount(req.params.id, req.body))
})
router.delete('/api/users/:id', (req, res) => res.status(405).set('Allow', 'GET, PUT').json({ error: true, code: 'METHOD_NOT_ALLOWED', message: 'Accounts are deactivated, not deleted, to preserve reports and comments' }))
export default router
