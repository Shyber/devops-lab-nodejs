import { beforeEach, describe, it, expect } from 'vitest'
import { store, resetStore, nextId, findIncident, recordChange } from '../../src/data/cirsStore.js'
import { check, text, id, fields, isFinal } from '../../src/utils/validation.js'
beforeEach(resetStore)

describe('Common CIRS fixtures and input validation', () => {
  it('restores fixtures and provides IDs even for empty or non-contiguous arrays', () => {
    store.incidents.length = 0
    store.analysts.push({ id: 50 })
    resetStore()
    expect(store.incidents).toHaveLength(6)
    expect(store.analysts).toHaveLength(3)
    expect(store.categories.filter(item => item.active)).toHaveLength(5)
    expect(nextId([])).toBe(1)
    expect(nextId([{ id: 1 }, { id: 7 }])).toBe(8)
  })
  it('finds an incident and records an actor-aware change', () => {
    const incident = findIncident('1')
    recordChange(incident, 'ASSIGNED', null, 2)
    expect(incident.history[0]).toMatchObject({ action: 'ASSIGNED', actorId: 1, oldValue: null, newValue: 2 })
    expect(() => findIncident('99999')).toThrow('Incident not found')
  })
  it.each([1, '1', 100, Number.MAX_SAFE_INTEGER])('accepts a positive safe ID %j', value => expect(id(value)).toBe(Number(value)))
  it.each([undefined, null, true, false, [], [1], {}, 0, -1, 1.5, '1.5', '01', '', ' 1 ', '1e2', Number.MAX_SAFE_INTEGER + 1])('rejects an unsafe ID %j', value => expect(() => id(value)).toThrow('Expected a positive integer ID'))
  it.each([['abc', true], ['  abc  ', true], ['abcde', true], ['ab', false], ['abcdef', false], [null, false], [3, false]])('checks trimmed text boundaries %j', (value, valid) => {
    if (valid) expect(text(value, 'name', 3, 5)).toBe(value.trim())
    else expect(() => text(value, 'name', 3, 5)).toThrow()
  })
  it('validates object shape and preserves HTTP status and code on errors', () => {
    fields({ title: 'Demo' }, ['title'])
    for (const body of [null, [], 'value', 1, { extra: 1 }]) expect(() => fields(body, ['title'])).toThrow()
    expect(() => check(false, 409, 'CONFLICT', 'Conflict')).toThrow(expect.objectContaining({ status: 409, code: 'CONFLICT' }))
    check(true, 400, 'UNUSED', 'Unused')
  })
  it('treats only CLOSED and REJECTED as final', () => {
    expect(['CLOSED', 'REJECTED'].every(isFinal)).toBe(true)
    expect(['REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].some(isFinal)).toBe(false)
  })
})
