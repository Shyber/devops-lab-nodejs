// Extends Kandarp Pandya's tests from PR #16 with data consistency checks.
import { beforeEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { store, resetStore } from '../src/data/cirsStore.js'

beforeEach(resetStore)

describe('CIRS Metrics API - SCRUM-14 and SCRUM-15', () => {
  it('returns the exact Jira contract with counts from the demonstration data', async () => {
    const response = await request(app).get('/api/metrics').expect(200)
    expect(Object.keys(response.body).sort()).toEqual(['activeIncidents', 'criticalAlerts', 'onlineAnalysts', 'status', 'system', 'systemUptime'])
    expect(response.body).toMatchObject({ system: 'Cyber Incident Reporting System', status: 'Operational', activeIncidents: 4, criticalAlerts: 2, onlineAnalysts: 1 })
    expect(response.body.systemUptime).toBeGreaterThanOrEqual(0)
    for (const name of ['activeIncidents', 'criticalAlerts', 'onlineAnalysts']) expect(Number.isInteger(response.body[name])).toBe(true)
  })
  it('updates counts when fixture data changes instead of returning constants', async () => {
    store.incidents.push({ id: 50, status: 'REPORTED', priority: 'CRITICAL' })
    store.presence.push({ analystId: 2, online: true }, { analystId: 1, online: true })
    const response = await request(app).get('/api/metrics')
    expect(response.body).toMatchObject({ activeIncidents: 5, criticalAlerts: 3, onlineAnalysts: 2 })
  })
  it('excludes final incidents and inactive or non-analyst presence', async () => {
    store.incidents.forEach(item => { item.status = item.id % 2 ? 'CLOSED' : 'REJECTED' })
    store.analysts[0].role = 'ADMIN'
    store.presence.push({ analystId: 99999, online: true })
    const response = await request(app).get('/api/metrics')
    expect(response.body).toMatchObject({ activeIncidents: 0, criticalAlerts: 0, onlineAnalysts: 0 })
  })
  it('handles empty fixtures without fabricated counts', async () => {
    store.incidents = []
    store.analysts = []
    expect((await request(app).get('/api/metrics')).body).toMatchObject({ activeIncidents: 0, criticalAlerts: 0, onlineAnalysts: 0 })
  })
  it('rejects unsupported filters and refuses POST on computed metrics', async () => {
    await request(app).get('/api/metrics?priority=HIGH').expect(400)
    const response = await request(app).post('/api/metrics').send({ activeIncidents: 900 }).expect(405)
    expect(response.headers.allow).toBe('GET')
    expect(response.body.code).toBe('READ_ONLY_METRICS')
    expect((await request(app).get('/api/metrics')).body.activeIncidents).toBe(4)
  })
})
