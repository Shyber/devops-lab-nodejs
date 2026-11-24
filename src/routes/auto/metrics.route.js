// Based on Kandarp Pandya's CIRS adaptation in PR #16.
// Every count is calculated from the database on each request.
import express from 'express'
import { metricCounts } from '../../data/cirsStore.js'
import { fields } from '../../utils/validation.js'

const router = express.Router()

router.get('/api/metrics', (req, res) => {
  fields(req.query, [])
  res.json({
    system: 'Cyber Incident Reporting System',
    status: 'Operational', // API availability, not a security verdict.
    ...metricCounts(),
    systemUptime: process.uptime()
  })
})

router.post('/api/metrics', (_req, res) => {
  res.set('Allow', 'GET').status(405).json({ error: true, code: 'READ_ONLY_METRICS', message: 'Metrics are calculated from incidents and analysts' })
})

export default router
