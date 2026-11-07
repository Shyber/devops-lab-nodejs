import { beforeEach, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { resetStore } from '../src/data/cirsStore.js'

beforeEach(resetStore)

it('assembles the four member components into one consistent workflow', async () => {
  const initial = (await request(app).get('/api/metrics')).body
  const analyst = (await request(app).post('/api/analysts').send({ name: 'Robin Taylor', email: 'robin@example.test' }).expect(201)).body
  const incident = (await request(app).post('/api/incidents').send({ title: 'Fictional phishing report', description: 'A fictional message is used to test the classroom reporting workflow.', categoryId: 1 }).expect(201)).body
  const count = (await request(app).get('/api/incidents')).body.length
  await request(app).post('/api/assignments').send({ incidentId: incident.id, analystId: analyst.id }).expect(201)
  const saved = (await request(app).get(`/api/incidents/${incident.id}`)).body
  expect(saved.assignedAnalystId).toBe(analyst.id)
  expect(saved.status).toBe('ASSIGNED')
  expect(saved.history.map(item => item.action)).toEqual(['CREATED', 'ASSIGNED', 'STATUS_CHANGED'])
  expect((await request(app).get('/api/incidents')).body).toHaveLength(count)
  const after = (await request(app).get('/api/metrics')).body
  expect(after.activeIncidents).toBe(initial.activeIncidents + 1)
  expect(after.criticalAlerts).toBe(initial.criticalAlerts)
  expect(after.onlineAnalysts).toBe(initial.onlineAnalysts) // Creating a directory entry does not log in a user.
})
