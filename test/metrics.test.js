import request from 'supertest'
import { describe, it, expect } from 'vitest'
import app from '../src/app.js'

describe('CIRS Metrics API', () => {
  it('GET /api/metrics should return system statistics', async () => {
    const res = await request(app).get('/api/metrics')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('system', 'Cyber Incident Reporting System')
    expect(res.body).toHaveProperty('status', 'Secure')
    expect(res.body).toHaveProperty('activeIncidents')
    expect(res.body).toHaveProperty('criticalAlerts')
    expect(res.body).toHaveProperty('systemUptime')
  })
})
