import { beforeEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import app from '../src/app.js'
import { db } from '../src/data/db.js'
import { resetStore } from '../src/data/cirsStore.js'
import { resetAccounts } from '../src/security/auth.js'

const password = process.env.CIRS_DEMO_PASSWORD || 'CampusDemo2026!'
async function login (email = 'admin@example.test') {
  const result = await request(app).post('/api/auth/login').send({ email, password }).expect(200)
  return result.body.token
}
beforeEach(() => { resetStore(); resetAccounts() })

describe('SCRUM-10 real authentication and sessions', () => {
  it.each(['admin@example.test', 'maya.chen@example.test', 'campus.user@example.test'])('logs in %s and returns only public account fields', async email => {
    const result = await request(app).post('/api/auth/login').send({ email, password }).expect(200)
    expect(result.body.expiresIn).toBe(1800)
    expect(result.body.user).not.toHaveProperty('password_hash')
    expect(result.body.user).not.toHaveProperty('password')
    const me = await request(app).get('/api/auth/me').auth(result.body.token, { type: 'bearer' }).expect(200)
    expect(me.body.email).toBe(email)
    const stored = db.prepare('SELECT password_hash FROM accounts WHERE email = ?').get(email)
    expect(stored.password_hash).not.toBe(password)
    expect(bcrypt.compareSync(password, stored.password_hash)).toBe(true)
  })
  it('uses the same public error for unknown, wrong-password and inactive logins', async () => {
    const attempts = [
      { email: 'unknown@example.test', password },
      { email: 'admin@example.test', password: 'incorrect' },
      { email: 'nora.silva@example.test', password }
    ]
    const responses = []
    for (const body of attempts) responses.push((await request(app).post('/api/auth/login').send(body).expect(401)).body)
    expect(responses[0]).toEqual(responses[1]); expect(responses[1]).toEqual(responses[2])
  })
  it('refuses anonymous, modified and expired sessions', async () => {
    await request(app).get('/api/auth/me').expect(401)
    const token = await login()
    await request(app).get('/api/auth/me').auth(token + 'changed', { type: 'bearer' }).expect(401)
    db.prepare('UPDATE auth_sessions SET expires_at = 1').run()
    await request(app).get('/api/auth/me').auth(token, { type: 'bearer' }).expect(401)
  })
  it('revokes logout server-side so the same token cannot be replayed', async () => {
    const token = await login()
    await request(app).post('/api/auth/logout').auth(token, { type: 'bearer' }).send({}).expect(204)
    await request(app).get('/api/auth/me').auth(token, { type: 'bearer' }).expect(401)
  })
  it('rejects a signed expired JWT even while the database session is still live', async () => {
    const token = await login()
    const decoded = jwt.decode(token)
    const secret = process.env.JWT_SECRET || db.prepare("SELECT value FROM auth_settings WHERE key = 'jwt_secret'").get().value
    const expired = jwt.sign({ sub: decoded.sub, jti: decoded.jti, iss: decoded.iss, aud: decoded.aud, exp: 1 }, secret, { algorithm: 'HS256' })
    await request(app).get('/api/auth/me').auth(expired, { type: 'bearer' }).expect(401)
    await request(app).get('/api/auth/me').auth(token, { type: 'bearer' }).expect(200)
  })
  it('checks the current active state on every request', async () => {
    const token = await login('campus.user@example.test')
    db.prepare('UPDATE accounts SET active = 0 WHERE id = 100').run()
    await request(app).get('/api/auth/me').auth(token, { type: 'bearer' }).expect(401)
  })
})

describe('SCRUM-11 administration and live role checks', () => {
  it('refuses user and analyst access to admin accounts', async () => {
    for (const email of ['campus.user@example.test', 'maya.chen@example.test']) {
      await request(app).get('/api/users').auth(await login(email), { type: 'bearer' }).expect(403)
    }
  })
  it('creates an account with a hash, rejects duplicates, and never returns the hash', async () => {
    const admin = await login()
    const body = { name: 'New Campus User', email: 'new.user@example.test', password: 'ExampleSecure2026!', role: 'USER' }
    const result = await request(app).post('/api/users').auth(admin, { type: 'bearer' }).send(body).expect(201)
    expect(result.body).toMatchObject({ name: body.name, email: body.email, role: 'USER', active: true })
    expect(result.body).not.toHaveProperty('password_hash')
    expect((await request(app).get('/api/users').auth(admin, { type: 'bearer' })).body.every(user => !('password_hash' in user))).toBe(true)
    await request(app).post('/api/users').auth(admin, { type: 'bearer' }).send({ ...body, email: 'NEW.USER@EXAMPLE.TEST' }).expect(409)
  })
  it.each([
    { password: 'short' }, { password: 'é'.repeat(37) }, { role: 'OWNER' }, { email: 'bad-address' }, { active: 'yes' }
  ])('refuses invalid account input %j without a new account', async bad => {
    const before = db.prepare('SELECT COUNT(*) AS n FROM accounts').get().n
    await request(app).post('/api/users').auth(await login(), { type: 'bearer' })
      .send({ name: 'Valid Name', email: 'valid@example.test', password: 'ExampleSecure2026!', role: 'USER', ...bad }).expect(400)
    expect(db.prepare('SELECT COUNT(*) AS n FROM accounts').get().n).toBe(before)
  })
  it('keeps analyst directory and accounts consistent', async () => {
    const token = await login()
    const created = await request(app).post('/api/users').auth(token, { type: 'bearer' })
      .send({ name: 'New Analyst', email: 'new.analyst@example.test', password: 'ExampleSecure2026!', role: 'ANALYST' }).expect(201)
    expect(db.prepare('SELECT role FROM analysts WHERE id = ?').get(created.body.id).role).toBe('ANALYST')
    await request(app).put(`/api/users/${created.body.id}`).auth(token, { type: 'bearer' }).send({ active: false }).expect(200)
    expect(db.prepare('SELECT active FROM analysts WHERE id = ?').get(created.body.id).active).toBe(0)
  })
  it('blocks analyst deactivation and demotion until open reports are reassigned', async () => {
    const token = await login()
    await request(app).put('/api/users/1').auth(token, { type: 'bearer' }).send({ active: false }).expect(409)
    await request(app).put('/api/users/1').auth(token, { type: 'bearer' }).send({ role: 'USER' }).expect(409)
    expect(db.prepare('SELECT active,role FROM accounts WHERE id = 1').get()).toEqual({ active: 1, role: 'ANALYST' })
  })
  it('protects the last active administrator', async () => {
    const token = await login()
    await request(app).put('/api/users/101').auth(token, { type: 'bearer' }).send({ active: false }).expect(409)
    await request(app).put('/api/users/101').auth(token, { type: 'bearer' }).send({ role: 'USER' }).expect(409)
  })
  it('does not permit deleting accounts and preserves associated history', async () => {
    const token = await login()
    await request(app).delete('/api/users/100').auth(token, { type: 'bearer' }).expect(405)
    expect(db.prepare('SELECT id FROM accounts WHERE id = 100').get()).toEqual({ id: 100 })
  })
  it('applies changed roles on the next request even with an existing JWT', async () => {
    const token = await login()
    const userToken = await login('other.user@example.test')
    await request(app).get('/api/users').auth(userToken, { type: 'bearer' }).expect(403)
    await request(app).put('/api/users/102').auth(token, { type: 'bearer' }).send({ role: 'ADMIN' }).expect(200)
    await request(app).get('/api/users').auth(userToken, { type: 'bearer' }).expect(200)
    await request(app).put('/api/users/102').auth(token, { type: 'bearer' }).send({ active: false }).expect(200)
    await request(app).get('/api/users').auth(userToken, { type: 'bearer' }).expect(401)
  })
  it('revokes existing sessions when an administrator changes the account password', async () => {
    const token = await login()
    const userToken = await login('other.user@example.test')
    await request(app).put('/api/users/102').auth(token, { type: 'bearer' }).send({ password: 'DifferentSecure2026!' }).expect(200)
    await request(app).get('/api/auth/me').auth(userToken, { type: 'bearer' }).expect(401)
    await request(app).post('/api/auth/login').send({ email: 'other.user@example.test', password }).expect(401)
    await request(app).post('/api/auth/login').send({ email: 'other.user@example.test', password: 'DifferentSecure2026!' }).expect(200)
  })
  it('rejects malformed account IDs without leaking an internal database error', async () => {
    await request(app).get('/api/users/invalid').auth(await login(), { type: 'bearer' }).expect(400)
  })
})
