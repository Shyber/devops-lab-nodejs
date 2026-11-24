import { beforeEach, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { db, resetStore } from '../src/data/cirsStore.js'
import { resetAccounts } from '../src/security/auth.js'

const password = process.env.CIRS_DEMO_PASSWORD || 'CampusDemo2026!'
let user, other, analyst, admin
beforeEach(async () => {
  resetStore()
  resetAccounts()
  const login = async email => (await request(app).post('/api/auth/login').send({ email, password }).expect(200)).body.token
  ;[user, other, analyst, admin] = await Promise.all([
    login('campus.user@example.test'), login('other.user@example.test'),
    login('maya.chen@example.test'), login('admin@example.test')
  ])
})
const valid = { title: 'Campus report for access testing', description: 'A fictional report used to check server enforced ownership.', categoryId: 1 }
const auth = token => `Bearer ${token}`

it('requires a session for API access and serves the separate interface', async () => {
  await request(app).get('/api/incidents').expect(401)
  await request(app).get('/app/').expect(200).expect('Content-Type', /html/)
  await request(app).get('/app/app.js').expect(200)
})
it('derives My Reports ownership from the session, never a query parameter', async () => {
  const mine = (await request(app).get('/api/incidents/my').set('Authorization', auth(user)).expect(200)).body
  expect(mine).toHaveLength(6)
  expect(mine.every(item => item.reporterId === 100)).toBe(true)
  expect((await request(app).get('/api/incidents/my').set('Authorization', auth(other)).expect(200)).body).toEqual([])
  await request(app).get('/api/incidents/my?reporterId=100').set('Authorization', auth(other)).expect(400)
  for (const suffix of ['', '/comments', '/history']) {
    await request(app).get(`/api/incidents/1${suffix}`).set('Authorization', auth(other)).expect(404)
  }
})
it('permits reporting only by campus users, with the authenticated reporter', async () => {
  await request(app).post('/api/incidents').set('Authorization', auth(analyst)).send(valid).expect(403)
  await request(app).post('/api/incidents').set('Authorization', auth(admin)).send(valid).expect(403)
  const response = await request(app).post('/api/incidents').set('Authorization', auth(other)).send(valid).expect(201)
  expect(response.body.reporterId).toBe(102)
  expect(response.body.history[0].actorId).toBe(102)
  await request(app).get(response.headers.location).set('Authorization', auth(user)).expect(404)
  await request(app).put(response.headers.location).set('Authorization', auth(user)).send({ title: 'Trying to edit another report' }).expect(404)
  await request(app).delete(response.headers.location).set('Authorization', auth(user)).expect(404)
})
it('refuses privileged lists and actions for campus users', async () => {
  for (const path of ['/api/incidents', '/api/analysts', '/api/metrics', '/api/assignments', '/api/users']) {
    await request(app).get(path).set('Authorization', auth(user)).expect(403)
  }
  await request(app).post('/api/assignments').set('Authorization', auth(user)).send({ incidentId: 1, analystId: 2 }).expect(403)
  await request(app).post('/api/analysts').set('Authorization', auth(analyst)).send({ name: 'No Rights', email: 'norights@example.test' }).expect(403)
})
it('rolls back incident creation when the audit write fails', async () => {
  const before = db.prepare('SELECT COUNT(*) AS n FROM incidents').get().n
  db.exec("CREATE TEMP TRIGGER fail_creation BEFORE INSERT ON incident_history BEGIN SELECT RAISE(FAIL, 'audit unavailable'); END")
  try {
    await request(app).post('/api/incidents').set('Authorization', auth(user)).send(valid).expect(500)
    expect(db.prepare('SELECT COUNT(*) AS n FROM incidents').get().n).toBe(before)
  } finally { db.exec('DROP TRIGGER fail_creation') }
})
it('requires a real active analyst account for assignment and provisions directory entries safely', async () => {
  db.prepare("INSERT INTO analysts (id,name,email,role,active) VALUES (700,'Orphan entry','orphan@example.test','ANALYST',1)").run()
  await request(app).post('/api/assignments').set('Authorization', auth(analyst)).send({ incidentId: 1, analystId: 700 }).expect(400)
  const directory = (await request(app).post('/api/analysts').set('Authorization', auth(admin)).send({ name: 'Provisioned Analyst', email: 'provisioned@example.test' }).expect(201)).body
  const account = (await request(app).get(`/api/users/${directory.id}`).set('Authorization', auth(admin)).expect(200)).body
  expect(account).toEqual(directory)
  expect(account).not.toHaveProperty('password')
  expect(account).not.toHaveProperty('password_hash')
  await request(app).post('/api/assignments').set('Authorization', auth(analyst)).send({ incidentId: 1, analystId: directory.id }).expect(201)
  await request(app).post('/api/analysts').set('Authorization', auth(admin)).send({ name: 'Duplicate Account', email: 'campus.user@example.test' }).expect(409)
})
it('limits the inactive-category administration view to administrators', async () => {
  const all = (await request(app).get('/api/categories?active=all').set('Authorization', auth(admin)).expect(200)).body
  expect(all.some(item => !item.active)).toBe(true)
  await request(app).get('/api/categories?active=all').set('Authorization', auth(user)).expect(403)
  await request(app).get('/api/categories?active=false').set('Authorization', auth(admin)).expect(400)
})
