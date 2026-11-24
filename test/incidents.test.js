import { beforeEach, describe, it, expect } from 'vitest'
import request from './helpers/request.js'
import app from '../src/app.js'
import { resetStore, getIncident } from '../src/data/cirsStore.js'
import { snapshot, run, count } from './helpers/db.js'

beforeEach(resetStore)
const valid = { title: '  Suspicious training message  ', description: '  A fictional email asks for a password in a classroom exercise.  ', categoryId: 1 }

describe('Incidents API - SCRUM-12, SCRUM-13 and SCRUM-26', () => {
  it('lists all incidents newest first', async () => {
    const response = await request(app).get('/api/incidents').expect(200)
    expect(response.body.map(item => item.id)).toEqual([6, 5, 4, 3, 2, 1])
  })
  it('uses ID as a stable tie breaker for equal timestamps', async () => {
    run('UPDATE incidents SET created_at = (SELECT created_at FROM incidents WHERE id = 2) WHERE id = 1')
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
    const before = snapshot()
    await request(app).post('/api/incidents').send(body).expect(400)
    expect(snapshot()).toBe(before)
  })
  it('rejects missing and inactive categories', async () => {
    const before = snapshot()
    await request(app).post('/api/incidents').send({ ...valid, categoryId: 99999 }).expect(404)
    await request(app).post('/api/incidents').send({ ...valid, categoryId: 6 }).expect(400)
    expect(snapshot()).toBe(before)
  })
})

describe('Incidents API - Lab6 update and delete (SCRUM-12)', () => {
  it('updates the reported content and records only the changed fields', async () => {
    const response = await request(app).put('/api/incidents/1').send({ title: '  Updated campus email  ', categoryId: 1 }).expect(200)
    expect(response.body).toMatchObject({ id: 1, title: 'Updated campus email', categoryId: 1, status: 'REPORTED', priority: 'MEDIUM' })
    expect(response.body.updatedAt > response.body.createdAt).toBe(true)
    expect(response.body.history).toEqual([expect.objectContaining({
      action: 'UPDATED', actorId: 100, oldValue: { title: 'Suspicious campus email' }, newValue: { title: 'Updated campus email' }
    })])
    expect((await request(app).get('/api/incidents/1')).body).toEqual(response.body)
  })
  it('changes description and category of an assigned incident without touching its workflow', async () => {
    const description = 'An updated fictional description of the unexpected access.'
    const response = await request(app).put('/api/incidents/2').send({ description, categoryId: 2 }).expect(200)
    expect(response.body).toMatchObject({ description, categoryId: 2, status: 'ASSIGNED', priority: 'HIGH', assignedAnalystId: 1 })
  })
  it('returns the incident unchanged and adds no history when nothing differs', async () => {
    const before = snapshot()
    const response = await request(app).put('/api/incidents/1').send({ title: 'Suspicious campus email' }).expect(200)
    expect(response.body.history).toEqual([])
    expect(snapshot()).toBe(before)
  })
  it.each([
    [1, {}, 400], [1, { title: 'tiny' }, 400], [1, { description: 'D'.repeat(19) }, 400],
    [1, { categoryId: 6 }, 400], [1, { categoryId: 99999 }, 404], [1, { categoryId: '1' }, 200],
    [1, { status: 'CLOSED' }, 400], [1, { priority: 'CRITICAL' }, 400], [1, { reporterId: 7 }, 400],
    [1, { assignedAnalystId: 2 }, 400], [4, { title: 'Edit a closed incident' }, 409],
    [5, { title: 'Edit a rejected incident' }, 409], [99999, { title: 'Missing incident' }, 404], ['abc', { title: 'Bad identifier' }, 400]
  ])('PUT /api/incidents/%s with %j returns %i', async (incidentId, body, code) => {
    const before = snapshot()
    await request(app).put(`/api/incidents/${incidentId}`).send(body).expect(code)
    if (code !== 200) expect(snapshot()).toBe(before)
  })
  it('deletes an unassigned reported incident with its history', async () => {
    const created = (await request(app).post('/api/incidents').send(valid).expect(201)).body
    await request(app).delete(`/api/incidents/${created.id}`).expect(204)
    await request(app).get(`/api/incidents/${created.id}`).expect(404)
    expect(count('incident_history')).toBe(0)
    expect(getIncident(created.id)).toBeUndefined()
  })
  it.each([[2, 409], [3, 409], [4, 409], [5, 409], [6, 409], [99999, 404], [0, 400]])('DELETE /api/incidents/%s returns %i and keeps the data', async (incidentId, code) => {
    const before = snapshot()
    const response = await request(app).delete(`/api/incidents/${incidentId}`).expect(code)
    if (code === 409) expect(response.body.code).toBe('INCIDENT_LOCKED')
    expect(snapshot()).toBe(before)
  })
})
