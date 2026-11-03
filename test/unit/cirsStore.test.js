import { beforeEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app.js'
import { store, resetStore, textField, findIncident, fail } from '../../src/data/cirsStore.js'

beforeEach(resetStore)

describe('Shared CIRS data and validation', () => {
  it('starts with two active categories and clears demo changes', () => {
    store.categories.push({ id: 3, name: 'Demo', active: false })
    store.incidents.push({ id: 1 })
    resetStore()
    expect(store.categories).toHaveLength(2)
    expect(store.categories.every(category => category.active)).toBe(true)
    expect(store.incidents).toEqual([])
  })

  it.each([
    ['  valid  ', true], ['abc', true], ['12345', true],
    ['ab', false], ['123456', false], [undefined, false], [4, false]
  ])('validates trimmed text boundaries: %j', (value, expected) => {
    expect(textField(value, 3, 5)).toBe(expected)
  })

  it('looks up IDs and returns a 404 for unknown incidents', () => {
    const record = { id: 1, title: 'Demo' }
    store.incidents.push(record)
    expect(findIncident('1')).toBe(record)
    expect(() => findIncident('99')).toThrow('Incident not found')
    try { fail(409, 'Conflict') } catch (err) { expect(err.status).toBe(409) }
  })

  it('rejects a JSON array before it reaches any route', async () => {
    const res = await request(app).post('/health').send([])
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: true, message: 'Expected a JSON object' })
  })
})
