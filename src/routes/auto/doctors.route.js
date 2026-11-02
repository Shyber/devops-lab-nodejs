import express from 'express'
import { doctors } from '../../data/doctors.js'

const router = express.Router()

router.get('/api/doctors', (_req, res) => {
  res.status(200).json(doctors)
})

router.get('/api/doctors/:id', (req, res) => {
  const doctor = doctors.find(item => String(item.id) === req.params.id)
  if (!doctor) return res.status(404).json({ error: true, message: 'Doctor not found' })
  res.status(200).json(doctor)
})

router.post('/api/doctors', (req, res) => {
  const { name, specialty } = req.body
  if (typeof name !== 'string' || typeof specialty !== 'string' || !name.trim() || !specialty.trim()) {
    return res.status(400).json({ error: true, message: 'Name and specialty are required strings' })
  }
  const doctor = { id: doctors.length + 1, name: name.trim(), specialty: specialty.trim() }
  doctors.push(doctor)
  res.status(201).json(doctor)
})

export default router
