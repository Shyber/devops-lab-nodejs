import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'

describe('Metrics API - DEVOPS-14', () => {
  it('returns hospital statistics', async () => {
    const res = await request(app).get('/api/metrics')

    expect(res.status).toBe(200)
    expect(res.body.hospital).toBe('Central Hospital')
    expect(res.body.status).toBe('Operational')

    for (const field of [
      'totalDoctors',
      'totalPatients',
      'activeAppointments',
      'systemUptime'
    ]) {
      expect(res.body[field]).toEqual(expect.any(Number))
      expect(res.body[field]).toBeGreaterThanOrEqual(0)
    }
  })
})
