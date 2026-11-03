import { beforeEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { appointments } from '../src/data/appointments.js'
import { doctors } from '../src/data/doctors.js'
import { patients } from '../src/data/patients.js'

const initialDoctors = doctors.map(doctor => ({ ...doctor }))
const initialPatients = patients.map(patient => ({ ...patient }))
const valid = { doctorId: 1, patientId: 1, date: '2027-03-15' }
beforeEach(() => {
  appointments.splice(0)
  doctors.splice(0, doctors.length, ...initialDoctors.map(doctor => ({ ...doctor })))
  patients.splice(0, patients.length, ...initialPatients.map(patient => ({ ...patient })))
})

describe('Appointments API - DEVOPS-13', () => {
  it('starts with an empty list', async () => {
    const res = await request(app).get('/api/appointments')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('creates, lists and reads an appointment with a server ID', async () => {
    const res = await request(app).post('/api/appointments').send({ ...valid, id: 99 })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: 1, ...valid })
    const one = await request(app).get('/api/appointments/1')
    expect(one.status).toBe(200)
    expect(one.body).toEqual(res.body)
    expect((await request(app).get('/api/appointments')).body).toEqual([res.body])
  })

  it('uses live doctors and patients created through their APIs', async () => {
    const doctor = await request(app).post('/api/doctors').send({ name: 'Dr. Sam', specialty: 'Neurology' })
    const patient = await request(app).post('/api/patients').send({ name: 'Marie', age: 29 })
    expect(doctor.status).toBe(201)
    expect(patient.status).toBe(201)
    const res = await request(app).post('/api/appointments').send({ ...valid, doctorId: doctor.body.id, patientId: patient.body.id })
    expect(res.status).toBe(201)
    expect(res.body.doctorId).toBe(doctor.body.id)
    expect(res.body.patientId).toBe(patient.body.id)
  })

  it('accepts leap day and generates successive IDs', async () => {
    const first = await request(app).post('/api/appointments').send({ ...valid, date: '2028-02-29' })
    const second = await request(app).post('/api/appointments').send(valid)
    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
    expect(second.body.id).toBe(first.body.id + 1)
  })

  it.each(['999999', 'unknown'])('returns 404 for absent appointment %s', async id => {
    const res = await request(app).get(`/api/appointments/${id}`)
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Appointment not found')
  })

  it.each([
    {}, { patientId: 1, date: valid.date }, { doctorId: 1, date: valid.date },
    { ...valid, doctorId: '1' }, { ...valid, doctorId: 0 }, { ...valid, doctorId: -1 },
    { ...valid, patientId: '1' }, { ...valid, patientId: 0 }, { ...valid, patientId: 1.5 },
    { ...valid, patientId: null }
  ])('rejects invalid or missing IDs: %j', async body => {
    const res = await request(app).post('/api/appointments').send(body)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
    expect(appointments).toEqual([])
  })

  it.each([undefined, null, 42, '', 'tomorrow', '2027-2-01', '2027-13-01', '2027-02-29', '2027-02-30', '2027-03-15T10:00:00Z'])('rejects invalid date %s', async date => {
    const res = await request(app).post('/api/appointments').send({ ...valid, date })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
    expect(appointments).toEqual([])
  })

  it.each([
    [{ ...valid, doctorId: 999999 }, 'Doctor not found'],
    [{ ...valid, patientId: 999999 }, 'Patient not found']
  ])('rejects a missing reference: %j', async (body, message) => {
    const res = await request(app).post('/api/appointments').send(body)
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: true, message })
    expect(appointments).toEqual([])
  })

  it('rejects arrays and malformed JSON', async () => {
    expect((await request(app).post('/api/appointments').send([])).status).toBe(400)
    expect((await request(app).post('/api/appointments').set('Content-Type', 'application/json').send('{')).status).toBe(400)
    expect(appointments).toEqual([])
  })
})
