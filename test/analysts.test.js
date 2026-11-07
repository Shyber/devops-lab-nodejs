import { beforeEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { store, resetStore } from '../src/data/cirsStore.js'

beforeEach(resetStore)
const valid = { name: '  Robin Taylor  ', email: '  ROBIN.TAYLOR@EXAMPLE.TEST  ' }

describe('Analysts API - SCRUM-11 Lab5 subset', () => {
  it('lists active analysts by default and supports explicit active filters', async () => {
    const active = await request(app).get('/api/analysts').expect(200)
    expect(active.body.map(item => item.id)).toEqual([1, 2])
    expect((await request(app).get('/api/analysts?active=false')).body.map(item => item.id)).toEqual([3])
    expect((await request(app).get('/api/analysts?active=all')).body).toHaveLength(3)
  })
  it('gets an analyst by ID', async () => {
    const result = await request(app).get('/api/analysts/1').expect(200)
    expect(result.body.email).toBe('maya.chen@example.test')
    expect(result.body).not.toHaveProperty('password')
  })
  it.each(['/api/analysts/0', '/api/analysts/abc', '/api/analysts/1.5', '/api/analysts?active=yes', '/api/analysts?unknown=x', '/api/analysts?active=true&active=false'])('rejects invalid input: %s', async path => {
    await request(app).get(path).expect(400)
  })
  it('returns 404 for a missing analyst', async () => {
    await request(app).get('/api/analysts/99999').expect(404)
  })
  it('creates and reads back a normalized analyst', async () => {
    const response = await request(app).post('/api/analysts').send(valid).expect(201)
    expect(response.body).toEqual({ id: 4, name: 'Robin Taylor', email: 'robin.taylor@example.test', role: 'ANALYST', active: true })
    expect(response.headers.location).toBe('/api/analysts/4')
    expect((await request(app).get(response.headers.location)).body).toEqual(response.body)
  })
  it('accepts an explicit inactive directory entry', async () => {
    const response = await request(app).post('/api/analysts').send({ ...valid, active: false }).expect(201)
    expect(response.body.active).toBe(false)
    expect((await request(app).get('/api/analysts')).body).toHaveLength(2)
  })
  it.each([
    {}, { name: 'A', email: 'a@example.test' }, { name: ' '.repeat(5), email: 'a@example.test' },
    { name: 7, email: 'a@example.test' }, { name: 'A'.repeat(101), email: 'a@example.test' },
    { name: 'Demo Analyst', email: 'invalid' }, { name: 'Demo Analyst', email: false },
    { ...valid, active: 'true' }, { ...valid, role: 'ADMIN' }, { ...valid, id: 99 },
    { ...valid, password: 'not-accepted-in-lab5' }
  ])('rejects invalid creation without changing data: %j', async body => {
    const before = JSON.stringify(store)
    await request(app).post('/api/analysts').send(body).expect(400)
    expect(JSON.stringify(store)).toBe(before)
  })
  it('refuses duplicate emails after trimming and lowercasing', async () => {
    const before = store.analysts.length
    const response = await request(app).post('/api/analysts').send({ name: 'Another name', email: ' MAYA.CHEN@EXAMPLE.TEST ' }).expect(409)
    expect(response.body.code).toBe('DUPLICATE_EMAIL')
    expect(store.analysts).toHaveLength(before)
  })
})
