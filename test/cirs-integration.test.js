import { beforeEach, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { resetStore } from '../src/data/cirsStore.js'

beforeEach(resetStore)
it('shares analysts, incidents, assignments and computed metrics', async () => {
  const before = (await request(app).get('/api/metrics').expect(200)).body
  const analyst = (await request(app).post('/api/analysts').send({ name: 'Integration Analyst', email: 'integration@example.test' }).expect(201)).body
  const incident = (await request(app).post('/api/incidents').send({ title: 'Fictional integration incident', description: 'Fictional classroom report for cross component validation.', categoryId: 1 }).expect(201)).body
  const count = (await request(app).get('/api/incidents')).body.length
  await request(app).post('/api/assignments').send({ incidentId: incident.id, analystId: analyst.id }).expect(201)
  const saved = (await request(app).get(`/api/incidents/${incident.id}`).expect(200)).body
  expect(saved.assignedAnalystId).toBe(analyst.id)
  expect(saved.status).toBe('ASSIGNED')
  expect((await request(app).get('/api/incidents')).body).toHaveLength(count)
  const after = (await request(app).get('/api/metrics').expect(200)).body
  expect(after.activeIncidents).toBe(before.activeIncidents + 1)
  expect(after.criticalAlerts).toBe(before.criticalAlerts)
  expect(after.onlineAnalysts).toBe(before.onlineAnalysts)
})
