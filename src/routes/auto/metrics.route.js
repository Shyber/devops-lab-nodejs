import express from 'express'

const router = express.Router()

router.get('/api/metrics', (req, res) => {
  res.status(200).json({
    hospital: 'Central Hospital',
    status: 'Operational',
    totalDoctors: 5,
    totalPatients: 10,
    activeAppointments: 3,
    systemUptime: process.uptime()
  })
})

export default router
