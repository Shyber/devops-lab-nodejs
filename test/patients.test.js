import { beforeEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { patients } from '../src/data/patients.js'

const initialPatients = patients.map(patient => ({ ...patient }))
beforeEach(() => {
  patients.splice(0, patients.length, ...initialPatients.map(patient => ({ ...patient })))
})

describe('Patients API - DEVOPS-12', () => {
  it('returns the list and a patient by ID', async () => {
    const list = await request(app).get('/api/patients')
    expect(list.status).toBe(200)
    expect(list.body).toEqual(initialPatients)
    const one = await request(app).get('/api/patients/1')
    expect(one.status).toBe(200)
    expect(one.body).toEqual(initialPatients[0])
  })

  it.each(['999999', 'unknown'])('returns 404 for missing patient %s', async id => {
    const res = await request(app).get(`/api/patients/${id}`)
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: true, message: 'Patient not found' })
  })

  it('creates a patient, trims the name and ignores the supplied ID', async () => {
    const res = await request(app).post('/api/patients').send({ id: 99, name: ' Marie ', age: 29 })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: 3, name: 'Marie', age: 29 })
    expect((await request(app).get('/api/patients/3')).body).toEqual(res.body)
    expect((await request(app).get('/api/patients')).body).toHaveLength(3)
  })

  it('accepts boundary ages and generates successive IDs', async () => {
    const first = await request(app).post('/api/patients').send({ name: 'Baby', age: 0 })
    const second = await request(app).post('/api/patients').send({ name: 'Senior', age: 130 })
    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
    expect(second.body.id).toBe(first.body.id + 1)
  })

  it.each([
    {}, { name: 'Marie' }, { age: 29 }, { name: 42, age: 29 },
    { name: '', age: 29 }, { name: '   ', age: 29 },
    { name: 'Marie', age: '29' }, { name: 'Marie', age: null },
    { name: 'Marie', age: -1 }, { name: 'Marie', age: 131 },
    { name: 'Marie', age: 29.5 }, { name: 'Marie', age: false }
  ])('rejects invalid fields without changing records: %j', async body => {
    const res = await request(app).post('/api/patients').send(body)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
    expect(patients).toEqual(initialPatients)
  })

  it('rejects arrays and malformed JSON', async () => {
    expect((await request(app).post('/api/patients').send([])).status).toBe(400)
    expect((await request(app).post('/api/patients').set('Content-Type', 'application/json').send('{')).status).toBe(400)
    expect(patients).toEqual(initialPatients)
  })
})
