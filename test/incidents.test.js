import { beforeEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { store, resetStore } from '../src/data/cirsStore.js'

beforeEach(resetStore)
const valid = { title: '  Suspicious training message  ', description: '  A fictional email asks for a password in a classroom exercise.  ', categoryId: 1 }

describe('Incidents API - SCRUM-12, SCRUM-13 and SCRUM-26', () => {
  it('lists all incidents newest first without changing stored order', async () => {
    const response = await request(app).get('/api/incidents').expect(200)
    expect(response.body.map(item => item.id)).toEqual([6, 5, 4, 3, 2, 1])
    expect(store.incidents.map(item => item.id)).toEqual([1, 2, 3, 4, 5, 6])
  })
  it('uses ID as a stable tie breaker for equal timestamps', async () => {
    store.incidents[0].createdAt = store.incidents[1].createdAt
    const response = await request(app).get('/api/incidents')
    expect(response.body.findIndex(item => item.id === 2)).toBeLessThan(response.body.findIndex(item => item.id === 1))
  })
  it.each([
    ['status=REPORTED', [1]], ['priority=CRITICAL', [6, 3]], ['categoryId=4', [6, 3]],
    ['category=Malware', [6, 3]], ['status=IN_PROGRESS&priority=CRITICAL&category=Malware', [3]],
    ['status=REPORTED&priority=LOW', []], ['category=Unknown', []]
  ])('combines selected filters using AND: %s', async (query, ids) => {
    const response = await request(app).get(`/api/incidents?${query}`).expect(200)
    expect(response.body.map(item => item.id)).toEqual(ids)
  })
  it.each(['status=BANANA', 'priority=urgent', 'categoryId=0', 'categoryId=1.2', 'page=1',
    'category=Malware&categoryId=4', 'category=Malware&category=Other', 'status=REPORTED&status=CLOSED'])('rejects malformed filters: %s', async query => {
    await request(app).get(`/api/incidents?${query}`).expect(400)
  })
  it('returns one existing incident or a clear 404', async () => {
    expect((await request(app).get('/api/incidents/1').expect(200)).body.id).toBe(1)
    expect((await request(app).get('/api/incidents/99999').expect(404)).body.code).toBe('INCIDENT_NOT_FOUND')
    await request(app).get('/api/incidents/not-a-number').expect(400)
  })
  it('creates an incident with server-owned defaults and creation history', async () => {
    const response = await request(app).post('/api/incidents').send(valid).expect(201)
    expect(response.body).toMatchObject({
      id: 7,
      title: valid.title.trim(),
      description: valid.description.trim(),
      categoryId: 1,
      reporterId: 100,
      priority: 'MEDIUM',
      status: 'REPORTED',
      assignedAnalystId: null
    })
    expect(response.headers.location).toBe('/api/incidents/7')
    expect(new Date(response.body.createdAt).toISOString()).toBe(response.body.createdAt)
    expect(response.body.history).toEqual([expect.objectContaining({ action: 'CREATED', actorId: 100, oldValue: null, newValue: 'REPORTED' })])
    expect((await request(app).get('/api/incidents/7')).body).toEqual(response.body)
  })
  it.each([[5, 20], [120, 5000]])('accepts exact SRS text boundaries %i / %i', async (titleLength, descriptionLength) => {
    await request(app).post('/api/incidents').send({ title: 'T'.repeat(titleLength), description: 'D'.repeat(descriptionLength), categoryId: 1 }).expect(201)
  })
  it.each([
    {}, { ...valid, title: 'tiny' }, { ...valid, title: 'T'.repeat(121) }, { ...valid, title: false },
    { ...valid, title: '     ' }, { ...valid, description: 'D'.repeat(19) },
    { ...valid, description: 'D'.repeat(5001) }, { ...valid, description: {} },
    { ...valid, categoryId: 0 }, { ...valid, categoryId: true }, { ...valid, categoryId: [1] },
    { ...valid, status: 'CLOSED' }, { ...valid, priority: 'CRITICAL' },
    { ...valid, reporterId: 99 }, { ...valid, assignedAnalystId: 1 }
  ])('rejects invalid creation without a partial record: %j', async body => {
    const before = JSON.stringify(store)
    await request(app).post('/api/incidents').send(body).expect(400)
    expect(JSON.stringify(store)).toBe(before)
  })
  it('rejects missing and inactive categories', async () => {
    const before = JSON.stringify(store)
    await request(app).post('/api/incidents').send({ ...valid, categoryId: 99999 }).expect(404)
    await request(app).post('/api/incidents').send({ ...valid, categoryId: 6 }).expect(400)
    expect(JSON.stringify(store)).toBe(before)
  })
})
