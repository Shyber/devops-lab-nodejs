import { beforeEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { doctors } from '../src/data/doctors.js'

const initialDoctors = doctors.map(doctor => ({ ...doctor }))
beforeEach(() => {
  doctors.splice(0, doctors.length, ...initialDoctors.map(doctor => ({ ...doctor })))
})

describe('Doctors API - DEVOPS-11', () => {
  it('returns the initial doctor list', async () => {
    const res = await request(app).get('/api/doctors')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(initialDoctors)
  })

  it('returns one doctor by ID', async () => {
    const res = await request(app).get('/api/doctors/1')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(initialDoctors[0])
  })

  it.each(['999', 'unknown'])('returns 404 for an absent doctor: %s', async id => {
    const res = await request(app).get(`/api/doctors/${id}`)
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: true, message: 'Doctor not found' })
  })

  it('creates a doctor with a server ID and trimmed fields', async () => {
    const res = await request(app).post('/api/doctors').send({ id: 99, name: ' Dr. Julie ', specialty: ' Neurology ' })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: 3, name: 'Dr. Julie', specialty: 'Neurology' })
    expect((await request(app).get('/api/doctors/3')).body).toEqual(res.body)
    expect((await request(app).get('/api/doctors')).body).toHaveLength(3)
  })

  it('generates different IDs for successive creations', async () => {
    const first = await request(app).post('/api/doctors').send({ name: 'Dr. Julie', specialty: 'Neurology' })
    const second = await request(app).post('/api/doctors').send({ name: 'Dr. Sam', specialty: 'Dermatology' })
    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
    expect(second.body.id).toBe(first.body.id + 1)
  })

  it.each([
    {}, { name: 'Dr. Julie' }, { specialty: 'Neurology' },
    { name: 42, specialty: 'Neurology' }, { name: 'Dr. Julie', specialty: null },
    { name: '   ', specialty: 'Neurology' }, { name: 'Dr. Julie', specialty: '   ' }
  ])('rejects invalid fields without inserting a doctor: %j', async body => {
    const res = await request(app).post('/api/doctors').send(body)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
    expect(doctors).toEqual(initialDoctors)
  })

  it('rejects malformed JSON and JSON arrays', async () => {
    const malformed = await request(app).post('/api/doctors').set('Content-Type', 'application/json').send('{')
    expect(malformed.status).toBe(400)
    expect((await request(app).post('/api/doctors').send([])).status).toBe(400)
    expect(doctors).toEqual(initialDoctors)
  })
})
