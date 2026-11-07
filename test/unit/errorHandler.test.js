import { describe, it, expect } from 'vitest'
import { errorHandler } from '../../src/utils/errorHandler.js'
function response () {
  return { status (code) { this.code = code; return this }, json (body) { this.body = body; return this } }
}
describe('Safe JSON error responses', () => {
  it.each([{}, null, undefined, { status: 999 }, { status: '400' }, { status: 503, message: 'private database detail' }])('uses a generic message for unexpected failures: %j', error => {
    const res = response()
    errorHandler(error, {}, res, () => {})
    expect(res.code).toBe(error?.status === 503 ? 503 : 500)
    expect(res.body).toEqual({ error: true, code: 'INTERNAL_ERROR', message: 'Internal Server Error' })
  })
  it('keeps expected errors but replaces malformed JSON details', () => {
    const res = response()
    errorHandler({ status: 409, code: 'CONFLICT', message: 'Conflict' }, {}, res, () => {})
    expect(res.body).toEqual({ error: true, code: 'CONFLICT', message: 'Conflict' })
    errorHandler({ status: 400 }, {}, res, () => {})
    expect(res.body.message).toBe('Invalid request')
    errorHandler({ status: 400, type: 'entity.parse.failed', message: 'body content' }, {}, res, () => {})
    expect(res.body).toEqual({ error: true, code: 'INVALID_JSON', message: 'Invalid JSON body' })
  })
})
