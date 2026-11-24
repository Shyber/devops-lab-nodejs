// Extends Kandarp Pandya's tests from PR #16 with data consistency checks.
import { beforeEach, describe, it, expect } from 'vitest'
import request from './helpers/request.js'
import app from '../src/app.js'
import { resetStore } from '../src/data/cirsStore.js'
import { run } from './helpers/db.js'

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
    run(`INSERT INTO incidents (id, title, description, category_id, reporter_id, status, priority, created_at, updated_at)
      VALUES (50, 'Extra critical incident', 'Fictional extra incident for metrics.', 1, 100, 'REPORTED', 'CRITICAL', 'now', 'now')`)
    run('UPDATE analyst_presence SET online = 1 WHERE analyst_id IN (1, 2)')
    const response = await request(app).get('/api/metrics')
    expect(response.body).toMatchObject({ activeIncidents: 5, criticalAlerts: 3, onlineAnalysts: 2 })
  })
  it('excludes final incidents and inactive or non-analyst presence', async () => {
    run("UPDATE incidents SET status = CASE WHEN id % 2 = 1 THEN 'CLOSED' ELSE 'REJECTED' END")
    run("UPDATE analysts SET role = 'ADMIN' WHERE id = 1")
    const response = await request(app).get('/api/metrics')
    expect(response.body).toMatchObject({ activeIncidents: 0, criticalAlerts: 0, onlineAnalysts: 0 })
  })
  it('handles empty fixtures without fabricated counts', async () => {
    run('DELETE FROM incident_history')
    run('DELETE FROM incidents')
    run('DELETE FROM analysts')
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
