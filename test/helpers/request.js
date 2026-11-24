// The original component contracts now run through real authenticated sessions.
// Permission failures are exercised separately against the unwrapped application.
import supertest from 'supertest'
import { beforeEach } from 'vitest'
import app from '../../src/app.js'
import { db } from '../../src/data/db.js'

let tokens
beforeEach(async () => {
  db.exec('DELETE FROM auth_sessions WHERE account_id > 102; DELETE FROM accounts WHERE id > 102;')
  if (tokens) return
  tokens = {}
  for (const [role, email] of Object.entries({ USER: 'campus.user@example.test', ADMIN: 'admin@example.test' })) {
    const response = await supertest(app).post('/api/auth/login').send({ email, password: process.env.CIRS_DEMO_PASSWORD || 'CampusDemo2026!' }).expect(200)
    tokens[role] = response.body.token
  }
})

export default function request (target) {
  const agent = supertest(target)
  return new Proxy(agent, {
    get (object, key) {
      if (!['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(key)) return object[key]
      return path => {
        const ownWrite = (key === 'post' && path === '/api/incidents') || (['put', 'delete'].includes(key) && path.startsWith('/api/incidents/'))
        return object[key](path).set('Authorization', `Bearer ${tokens[ownWrite ? 'USER' : 'ADMIN']}`)
      }
    }
  })
}
