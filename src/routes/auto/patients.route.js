/**
 * GET  /api/patients → list all patients
 * POST /api/patients → add a patient { name, age }
 */
import { Router } from 'express'
import { patients, nextId } from '../../data/store.js'

const router = Router()

router.get('/api/patients', (_req, res) => res.status(200).json(patients))

router.post('/api/patients', (req, res) => {
  const { name, age } = req.body ?? {}
  if (!name || age === undefined || age === null) {
    return res.status(400).json({ error: 'Missing fields' })
  }
  if (!Number.isInteger(age) || age < 0) {
    return res.status(400).json({ error: 'Age must be a positive integer' })
  }
  const newPatient = { id: nextId(patients), name, age }
  patients.push(newPatient)
  res.status(201).json(newPatient)
})

export default router
