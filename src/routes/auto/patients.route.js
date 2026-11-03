import express from 'express'
import { patients } from '../../data/patients.js'

const router = express.Router()

router.get('/api/patients', (_req, res) => {
  res.status(200).json(patients)
})

router.get('/api/patients/:id', (req, res) => {
  const patient = patients.find(item => String(item.id) === req.params.id)
  if (!patient) return res.status(404).json({ error: true, message: 'Patient not found' })
  res.status(200).json(patient)
})

router.post('/api/patients', (req, res) => {
  const { name, age } = req.body
  if (typeof name !== 'string' || !name.trim() || !Number.isInteger(age) || age < 0 || age > 130) {
    return res.status(400).json({ error: true, message: 'Name must be a non-empty string and age an integer from 0 to 130' })
  }
  const patient = { id: patients.length + 1, name: name.trim(), age }
  patients.push(patient)
  res.status(201).json(patient)
})

export default router
