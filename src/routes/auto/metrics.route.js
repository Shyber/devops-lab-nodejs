// Based on Kandarp Pandya's CIRS adaptation in PR #16.
// Prepared follow-up: calculate every count from the shared Lab5 fixtures.
import express from 'express'
import { store } from '../../data/cirsStore.js'
import { isFinal, fields } from '../../utils/validation.js'

const router = express.Router()

router.get('/api/metrics', (req, res) => {
  fields(req.query, [])
  const active = store.incidents.filter(item => !isFinal(item.status))
  const onlineIds = new Set(store.presence.filter(item => item.online).map(item => item.analystId))
  res.json({
    system: 'Cyber Incident Reporting System',
    status: 'Operational', // API availability, not a security verdict.
    activeIncidents: active.length,
    criticalAlerts: active.filter(item => item.priority === 'CRITICAL').length,
    onlineAnalysts: store.analysts.filter(item => item.active && item.role === 'ANALYST' && onlineIds.has(item.id)).length,
    systemUptime: process.uptime()
  })
})

router.post('/api/metrics', (_req, res) => {
  res.set('Allow', 'GET').status(405).json({ error: true, code: 'READ_ONLY_METRICS', message: 'Metrics are calculated from incidents and analysts' })
})

export default router
