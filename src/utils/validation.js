// Adapted from the prepared CIRS kit; limited to the Lab5 in-memory API.
export function check (condition, status, code, message) {
  if (!condition) {
    const error = new Error(message)
    error.status = status
    error.code = code
    throw error
  }
}

export function text (value, field, min, max) {
  check(typeof value === 'string', 400, 'INVALID_INPUT', `${field} must be a string`)
  const result = value.trim()
  check(result.length >= min && result.length <= max, 400, 'INVALID_INPUT', `${field} must contain ${min}-${max} characters`)
  return result
}

export function id (value) {
  check((typeof value === 'string' && /^[1-9]\d*$/.test(value)) ||
    (typeof value === 'number' && value > 0), 400, 'INVALID_ID', 'Expected a positive integer ID')
  check(Number.isSafeInteger(Number(value)), 400, 'INVALID_ID', 'Expected a positive integer ID')
  return Number(value)
}

export function fields (body, allowed) {
  check(body && typeof body === 'object' && !Array.isArray(body), 400, 'INVALID_INPUT', 'Expected a JSON object')
  check(Object.keys(body).every(key => allowed.includes(key)), 400, 'INVALID_INPUT', 'Unexpected field')
}

export const statuses = ['REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']
export const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
export const isFinal = status => status === 'CLOSED' || status === 'REJECTED'
