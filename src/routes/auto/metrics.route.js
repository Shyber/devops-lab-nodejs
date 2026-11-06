import express from 'express'
const router = express.Router()

router.get('/api/metrics', (req, res) => {
  res.status(200).json({
    system: 'Cyber Incident Reporting System',
    status: 'Secure',
    activeIncidents: 12,
    criticalAlerts: 2,
    onlineAnalysts: 5,
    systemUptime: process.uptime()
  })
})

export default router
