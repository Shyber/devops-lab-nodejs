import { beforeEach, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { resetStore } from '../src/data/cirsStore.js'
beforeEach(resetStore)
it('serves the teaching API and only active report categories', async () => {
  expect((await request(app).get('/')).body).toEqual({ ok: true, message: 'CIRS Lab5 teaching API' })
  const categories = (await request(app).get('/api/categories').expect(200)).body
  expect(categories).toHaveLength(5)
  expect(categories.every(item => item.active)).toBe(true)
})
it('returns consistent JSON for unknown and retired hospital routes', async () => {
  for (const path of ['/missing', '/api/doctors', '/api/patients', '/api/appointments']) {
    expect((await request(app).get(path).expect(404)).body.code).toBe('NOT_FOUND')
  }
})
it.each(['[]', 'null', '42', '"string"', '{invalid-json'])('rejects non-object or malformed JSON %s', async body => {
  const response = await request(app).post('/health').set('Content-Type', 'application/json').send(body).expect(400)
  expect(response.body.error).toBe(true)
  expect(response.body).not.toHaveProperty('stack')
})
it('rejects an excessive JSON body', async () => {
  await request(app).post('/health').send({ content: 'x'.repeat(33000) }).expect(413)
})
