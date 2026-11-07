export function errorHandler (err, _req, res, _next) {
  const candidate = err?.status
  const status = Number.isInteger(candidate) && candidate >= 400 && candidate <= 599 ? candidate : 500
  const unexpected = status >= 500
  const invalidJson = err?.type === 'entity.parse.failed'
  res.status(status).json({
    error: true,
    code: unexpected ? 'INTERNAL_ERROR' : invalidJson ? 'INVALID_JSON' : (err?.code || 'INVALID_INPUT'),
    message: unexpected ? 'Internal Server Error' : invalidJson ? 'Invalid JSON body' : (err?.message || 'Invalid request')
  })
}
