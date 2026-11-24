import { beforeEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { db, resetStore, getIncident } from '../src/data/cirsStore.js'
import { resetAccounts } from '../src/security/auth.js'

const password = process.env.CIRS_DEMO_PASSWORD || 'CampusDemo2026!'
const emails = { user: 'campus.user@example.test', other: 'other.user@example.test', analyst: 'maya.chen@example.test', admin: 'admin@example.test' }
let tokens
beforeEach(async () => {
  resetStore()
  resetAccounts()
  tokens = {}
  for (const [role, email] of Object.entries(emails)) {
    const login = await request(app).post('/api/auth/login').send({ email, password }).expect(200)
    tokens[role] = login.body.token
  }
})
const api = (role, method, path) => request(app)[method](path).set('Authorization', `Bearer ${tokens[role]}`)
const snapshot = () => JSON.stringify({
  incidents: db.prepare('SELECT * FROM incidents ORDER BY id').all(),
  history: db.prepare('SELECT * FROM incident_history ORDER BY id').all(),
  comments: db.prepare('SELECT * FROM comments ORDER BY id').all()
})

describe('SCRUM-16/17/18/19 - comments and public history', () => {
  it('keeps internal notes separate from the owner’s public discussion and history', async () => {
    const publicReply = await api('user', 'post', '/api/incidents/1/comments').send({ text: '  A public follow-up  ' }).expect(201)
    expect(publicReply.body).toMatchObject({ authorId: 100, incidentId: 1, text: 'A public follow-up', isInternal: false })
    await api('analyst', 'post', '/api/incidents/1/comments').send({ text: 'Secret training indicator', isInternal: true }).expect(201)
    const owner = await api('user', 'get', '/api/incidents/1/comments').expect(200)
    expect(owner.body).toHaveLength(1)
    expect(JSON.stringify(owner.body)).not.toContain('Secret training indicator')
    const analyst = await api('analyst', 'get', '/api/incidents/1/comments').expect(200)
    expect(analyst.body).toHaveLength(2)
    expect((await api('user', 'get', '/api/incidents/1/history')).body).toEqual([])
    expect(JSON.stringify((await api('user', 'get', '/api/incidents/1')).body)).not.toContain('Secret training indicator')
  })
  it('denies another campus account direct access to comments and history', async () => {
    await api('other', 'get', '/api/incidents/1/comments').expect(404)
    await api('other', 'post', '/api/incidents/1/comments').send({ text: 'Not my report' }).expect(404)
    await api('other', 'get', '/api/incidents/1/history').expect(404)
  })
  it('does not accept a campus user’s internal note or its text in an API response', async () => {
    const before = snapshot()
    await api('user', 'post', '/api/incidents/1/comments').send({ text: 'An internal note', isInternal: true }).expect(403)
    expect(snapshot()).toBe(before)
  })
  it.each([{}, { text: ' ' }, { text: 'x'.repeat(2001) }, { text: 5 }, { text: 'Valid', isInternal: 'true' }, { text: 'Valid', authorId: 1 }])('rejects malformed comments without writing: %j', async body => {
    const before = snapshot()
    await api('user', 'post', '/api/incidents/1/comments').send(body).expect(400)
    expect(snapshot()).toBe(before)
  })
  it.each([1, 2000])('accepts the exact trimmed comment boundary %i', async length => {
    const response = await api('admin', 'post', '/api/incidents/1/comments').send({ text: `  ${'T'.repeat(length)}  ` }).expect(201)
    expect(response.body.text).toHaveLength(length)
  })
  it.each([4, 5])('keeps final incident %i comments read-only', async incidentId => {
    const before = snapshot()
    await api('admin', 'post', `/api/incidents/${incidentId}/comments`).send({ text: 'New note', isInternal: true }).expect(409)
    expect(snapshot()).toBe(before)
  })
  it('permits comments and internal notes on a resolved incident', async () => {
    await api('user', 'post', '/api/incidents/6/comments').send({ text: 'Thank you for the resolution' }).expect(201)
    await api('analyst', 'post', '/api/incidents/6/comments').send({ text: 'Resolution follow-up', isInternal: true }).expect(201)
  })
  it('exposes no comment edit, delete or history write operation', async () => {
    const response = await api('user', 'post', '/api/incidents/1/comments').send({ text: 'Keep this comment' }).expect(201)
    const before = snapshot()
    await api('admin', 'put', `/api/incidents/1/comments/${response.body.id}`).send({ text: 'Changed' }).expect(404)
    await api('admin', 'delete', `/api/incidents/1/comments/${response.body.id}`).expect(404)
    await api('admin', 'post', '/api/incidents/1/history').send({ action: 'FAKE' }).expect(404)
    expect(snapshot()).toBe(before)
  })
})

describe('SCRUM-8/16 - priority and lifecycle', () => {
  it('records priority with the authenticated actor and avoids duplicate history for no-op', async () => {
    const response = await api('analyst', 'patch', '/api/incidents/1/priority').send({ priority: 'HIGH' }).expect(200)
    expect(response.body.priority).toBe('HIGH')
    expect(response.body.history).toEqual([expect.objectContaining({ actorId: 1, action: 'PRIORITY_CHANGED', oldValue: 'MEDIUM', newValue: 'HIGH' })])
    const before = snapshot()
    await api('analyst', 'patch', '/api/incidents/1/priority').send({ priority: 'HIGH' }).expect(200)
    expect(snapshot()).toBe(before)
    expect((await api('user', 'get', '/api/incidents/1/history')).body).toHaveLength(1)
  })
  it('allows the complete assigned → investigation → resolution → closed flow', async () => {
    await api('analyst', 'post', '/api/assignments').send({ incidentId: 1, analystId: 1 }).expect(201)
    await api('analyst', 'patch', '/api/incidents/1/status').send({ status: 'IN_PROGRESS' }).expect(200)
    await api('admin', 'patch', '/api/incidents/1/status').send({ status: 'RESOLVED', reason: '  Reset the fictional account.  ' }).expect(200)
    const comments = await api('user', 'get', '/api/incidents/1/comments').expect(200)
    expect(comments.body).toEqual([expect.objectContaining({ authorId: 101, text: 'Reset the fictional account.', isInternal: false })])
    const closed = await api('analyst', 'patch', '/api/incidents/1/status').send({ status: 'CLOSED' }).expect(200)
    expect(closed.body.status).toBe('CLOSED')
    expect(closed.body.history.filter(entry => entry.action === 'STATUS_CHANGED').map(entry => entry.newValue)).toEqual(['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  })
  it('requires a public rejection explanation and records it atomically', async () => {
    const before = snapshot()
    await api('analyst', 'patch', '/api/incidents/1/status').send({ status: 'REJECTED' }).expect(400)
    expect(snapshot()).toBe(before)
    const rejected = await api('analyst', 'patch', '/api/incidents/1/status').send({ status: 'REJECTED', reason: 'Duplicate training report' }).expect(200)
    expect(rejected.body.status).toBe('REJECTED')
    expect((await api('user', 'get', '/api/incidents/1/comments')).body[0].text).toBe('Duplicate training report')
  })
  it.each([[1, 'IN_PROGRESS'], [1, 'CLOSED'], [2, 'REPORTED'], [3, 'ASSIGNED'], [4, 'IN_PROGRESS'], [5, 'REPORTED'], [6, 'IN_PROGRESS']])('refuses forbidden transition for incident %i to %s', async (incidentId, status) => {
    const before = snapshot()
    await api('analyst', 'patch', `/api/incidents/${incidentId}/status`).send({ status }).expect(409)
    expect(snapshot()).toBe(before)
  })
  it('rejects status changes lacking an assignee without changing history', async () => {
    db.prepare('UPDATE incidents SET assigned_analyst_id = NULL WHERE id = 2').run()
    const before = snapshot()
    await api('analyst', 'patch', '/api/incidents/2/status').send({ status: 'IN_PROGRESS' }).expect(409)
    expect(snapshot()).toBe(before)
  })
  it('rolls back the status and explanation when the history write fails', async () => {
    const before = snapshot()
    db.exec("CREATE TEMP TRIGGER fail_workflow_history BEFORE INSERT ON incident_history BEGIN SELECT RAISE(ABORT, 'simulated audit failure'); END")
    try {
      await api('analyst', 'patch', '/api/incidents/1/status').send({ status: 'REJECTED', reason: 'A public explanation' }).expect(500)
      expect(snapshot()).toBe(before)
    } finally { db.exec('DROP TRIGGER fail_workflow_history') }
  })
  it.each(['priority', 'status'])('refuses a campus user’s %s change', async field => {
    await api('user', 'patch', `/api/incidents/1/${field}`).send({ [field]: field === 'priority' ? 'HIGH' : 'REJECTED', reason: 'No authority' }).expect(403)
  })
  it('rejects unknown, final and malformed priority changes', async () => {
    const before = snapshot()
    await api('analyst', 'patch', '/api/incidents/1/priority').send({ priority: 'URGENT' }).expect(400)
    await api('analyst', 'patch', '/api/incidents/4/priority').send({ priority: 'HIGH' }).expect(409)
    await api('analyst', 'patch', '/api/incidents/1/status').send({ status: 'BANANA' }).expect(400)
    expect(snapshot()).toBe(before)
  })
})

describe('SCRUM-20 - categories preserve old reports', () => {
  it('creates, renames and deactivates a category without losing its existing incidents', async () => {
    const category = (await api('admin', 'post', '/api/categories').send({ name: '  Training security  ' }).expect(201)).body
    expect(category).toMatchObject({ name: 'Training security', active: true })
    const incident = (await api('user', 'post', '/api/incidents').send({ title: 'Fictional category report', description: 'A fictional security report used only by the automated tests.', categoryId: category.id }).expect(201)).body
    await api('admin', 'put', `/api/categories/${category.id}`).send({ name: 'Renamed training security', active: false }).expect(200)
    expect(getIncident(incident.id).categoryId).toBe(category.id)
    await api('user', 'post', '/api/incidents').send({ title: 'Another fictional report', description: 'Another fictional security report used only by the automated tests.', categoryId: category.id }).expect(400)
    expect((await api('user', 'get', `/api/incidents/${incident.id}`)).body.id).toBe(incident.id)
  })
  it('rejects duplicate names including case and surrounding spaces', async () => {
    await api('admin', 'post', '/api/categories').send({ name: ' phishing ' }).expect(409)
    await api('admin', 'put', '/api/categories/2').send({ name: 'PHISHING' }).expect(409)
    expect(db.prepare('SELECT name FROM categories WHERE id = 2').get().name).toBe('Suspicious Link')
  })
  it.each(['user', 'analyst'])('denies category management to %s', async role => {
    await api(role, 'post', '/api/categories').send({ name: 'Forbidden' }).expect(403)
    await api(role, 'put', '/api/categories/1').send({ active: false }).expect(403)
  })
  it('refuses invalid category updates and unknown identifiers', async () => {
    await api('admin', 'post', '/api/categories').send({ name: ' ' }).expect(400)
    await api('admin', 'put', '/api/categories/1').send({}).expect(400)
    await api('admin', 'put', '/api/categories/1').send({ active: 'false' }).expect(400)
    await api('admin', 'put', '/api/categories/9999').send({ name: 'Missing' }).expect(404)
  })
})
