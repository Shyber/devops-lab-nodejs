import express from 'express'
import { appointments } from '../../data/appointments.js'
import { doctors } from '../../data/doctors.js'
import { patients } from '../../data/patients.js'

const router = express.Router()

router.get('/api/appointments', (_req, res) => {
  res.status(200).json(appointments)
})

router.get('/api/appointments/:id', (req, res) => {
  const appointment = appointments.find(item => String(item.id) === req.params.id)
  if (!appointment) return res.status(404).json({ error: true, message: 'Appointment not found' })
  res.status(200).json(appointment)
})

router.post('/api/appointments', (req, res) => {
  const { doctorId, patientId, date } = req.body
  if (!Number.isInteger(doctorId) || doctorId < 1 || !Number.isInteger(patientId) || patientId < 1) {
    return res.status(400).json({ error: true, message: 'DoctorId and patientId must be positive integers' })
  }
  // The round trip also rejects impossible dates such as February 30.
  const parsedDate = new Date(`${date}T00:00:00.000Z`)
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return res.status(400).json({ error: true, message: 'Date must be a valid calendar date in YYYY-MM-DD format' })
  }
  if (!doctors.some(doctor => doctor.id === doctorId)) {
    return res.status(404).json({ error: true, message: 'Doctor not found' })
  }
  if (!patients.some(patient => patient.id === patientId)) {
    return res.status(404).json({ error: true, message: 'Patient not found' })
  }
  const appointment = { id: appointments.length + 1, doctorId, patientId, date }
  appointments.push(appointment)
  res.status(201).json(appointment)
})

export default router
