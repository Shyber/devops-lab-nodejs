import { beforeEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { store, resetStore } from '../src/data/cirsStore.js'

beforeEach(resetStore)

describe('Assignments API - SCRUM-8 epic / SRS FR-05', () => {
  it('lists projections of existing assigned incidents', async () => {
    const response = await request(app).get('/api/assignments').expect(200)
    expect(response.body.map(item => item.incidentId)).toEqual([2, 3, 4, 6])
    expect((await request(app).get('/api/assignments?incidentId=1')).body).toEqual([])
    expect((await request(app).get('/api/assignments?incidentId=2')).body).toEqual([{ incidentId: 2, analystId: 1, status: 'ASSIGNED' }])
  })
  it.each([['incidentId=99999', 404], ['incidentId=0', 400], ['unknown=1', 400]])('rejects an invalid selection %s', async (query, code) => {
    await request(app).get(`/api/assignments?${query}`).expect(code)
  })
  it('assigns a reported incident, records the change and creates no incident', async () => {
    const count = store.incidents.length
    const response = await request(app).post('/api/assignments').send({ incidentId: 1, analystId: 2 }).expect(201)
    expect(response.body).toEqual({ incidentId: 1, analystId: 2, status: 'ASSIGNED' })
    expect(store.incidents).toHaveLength(count)
    expect(store.incidents[0].assignedAnalystId).toBe(2)
    expect(store.incidents[0].history.map(item => item.action)).toEqual(['ASSIGNED', 'STATUS_CHANGED'])
  })
  it.each([['ASSIGNED', 2], ['IN_PROGRESS', 3], ['RESOLVED', 6]])('reassigns %s without changing the status', async (status, incidentId) => {
    const analystId = incidentId === 3 ? 1 : 2
    const response = await request(app).post('/api/assignments').send({ incidentId, analystId }).expect(200)
    expect(response.body.status).toBe(status)
    expect(store.incidents.find(item => item.id === incidentId).history).toHaveLength(1)
  })
  it('does not add duplicate history when the same assignment is sent again', async () => {
    const before = JSON.stringify(store)
    await request(app).post('/api/assignments').send({ incidentId: 2, analystId: 1 }).expect(200)
    expect(JSON.stringify(store)).toBe(before)
  })
  it.each([
    [{}, 400], [{ incidentId: 1 }, 400], [{ incidentId: 0, analystId: 1 }, 400],
    [{ incidentId: 99999, analystId: 1 }, 404], [{ incidentId: 1, analystId: 99999 }, 404],
    [{ incidentId: 1, analystId: 3 }, 400], [{ incidentId: 1, analystId: null }, 400],
    [{ incidentId: [1], analystId: 1 }, 400], [{ incidentId: 1, analystId: 1.5 }, 400],
    [{ incidentId: 4, analystId: 2 }, 409], [{ incidentId: 5, analystId: 1 }, 409],
    [{ incidentId: 1, analystId: 1, title: 'Cannot create here' }, 400]
  ])('refuses invalid assignments without changing data: %j', async (body, code) => {
    const before = JSON.stringify(store)
    await request(app).post('/api/assignments').send(body).expect(code)
    expect(JSON.stringify(store)).toBe(before)
  })
  it('refuses a target with an ADMIN role even if active', async () => {
    store.analysts[0].role = 'ADMIN'
    const before = JSON.stringify(store)
    await request(app).post('/api/assignments').send({ incidentId: 1, analystId: 1 }).expect(400)
    expect(JSON.stringify(store)).toBe(before)
  })
  it('keeps /api/responses as an alias using the same records', async () => {
    await request(app).post('/api/responses').send({ incidentId: 1, analystId: 2 }).expect(201)
    expect((await request(app).get('/api/responses')).body).toEqual((await request(app).get('/api/assignments')).body)
    expect(store.incidents).toHaveLength(6)
  })
})
