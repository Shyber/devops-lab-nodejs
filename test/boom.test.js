import { it, expect } from 'vitest'
import request from './helpers/request.js'
import app from '../src/app.js'
it('returns a generic 500 without leaking the internal error', async () => {
  const response = await request(app).get('/boom').expect(500)
  expect(response.body).toEqual({ error: true, code: 'INTERNAL_ERROR', message: 'Internal Server Error' })
})
