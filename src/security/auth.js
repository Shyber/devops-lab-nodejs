import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../data/db.js'
import { check, text, id } from '../utils/validation.js'

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('USER', 'ANALYST', 'ADMIN')),
    active INTEGER NOT NULL CHECK(active IN (0, 1)) DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS auth_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    expires_at INTEGER NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0
  );
`)

const stored = db.prepare("SELECT value FROM auth_settings WHERE key = 'jwt_secret'").get()
const secret = process.env.JWT_SECRET || stored?.value || crypto.randomBytes(48).toString('hex')
if (!stored && !process.env.JWT_SECRET) db.prepare('INSERT INTO auth_settings (key, value) VALUES (?, ?)').run('jwt_secret', secret)
const lifetime = 30 * 60
const issuer = 'cirs-local'
const audience = 'cirs-web'
const password = () => process.env.CIRS_DEMO_PASSWORD || 'CampusDemo2026!'
export const accountById = accountId => db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId)
export const publicAccount = row => row && ({ id: row.id, name: row.name, email: row.email, role: row.role, active: row.active === 1 })
export const listAccounts = () => db.prepare('SELECT * FROM accounts ORDER BY id').all().map(publicAccount)

/** Fictional local demo accounts; call only to initialise/reset demonstration data. */
export function seedAccounts () {
  const hash = bcrypt.hashSync(password(), 10)
  const insert = db.prepare('INSERT OR IGNORE INTO accounts (id,name,email,password_hash,role,active) VALUES (?,?,?,?,?,?)')
  const entries = [
    [1, 'Maya Chen', 'maya.chen@example.test', 'ANALYST', 1],
    [2, 'Leo Martin', 'leo.martin@example.test', 'ANALYST', 1],
    [3, 'Nora Silva', 'nora.silva@example.test', 'ANALYST', 0],
    [100, 'Demo Campus User', 'campus.user@example.test', 'USER', 1],
    [101, 'Demo Administrator', 'admin@example.test', 'ADMIN', 1],
    [102, 'Other Campus User', 'other.user@example.test', 'USER', 1]
  ]
  for (const [accountId, name, email, role, active] of entries) insert.run(accountId, name, email, hash, role, active)
  // Add login identities for historical directory-only analysts without replacing
  // an existing account or resolving an ID/email collision by impersonation.
  const legacy = db.prepare("SELECT * FROM analysts WHERE role = 'ANALYST' ORDER BY id").all()
  for (const analyst of legacy) {
    if (accountById(analyst.id) || db.prepare('SELECT id FROM accounts WHERE email = ? COLLATE NOCASE').get(analyst.email)) continue
    const generatedHash = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10)
    insert.run(analyst.id, analyst.name, analyst.email.toLowerCase(), generatedHash, 'ANALYST', analyst.active)
  }
}

export const resetAccounts = db.transaction(() => {
  db.exec('DELETE FROM auth_sessions; DELETE FROM accounts;')
  seedAccounts()
})
seedAccounts()

export function signIn (email, suppliedPassword) {
  const row = typeof email === 'string' ? db.prepare('SELECT * FROM accounts WHERE email = ? COLLATE NOCASE').get(email.trim()) : null
  // Check a hash even for unknown users, keeping the public failure response uniform.
  const hash = row?.password_hash || dummyHash
  const matches = typeof suppliedPassword === 'string' && bcrypt.compareSync(suppliedPassword, hash)
  check(row && matches && row.active === 1, 401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  const sessionId = crypto.randomUUID()
  const token = jwt.sign({}, secret, { algorithm: 'HS256', subject: String(row.id), jwtid: sessionId, expiresIn: lifetime, issuer, audience })
  const decoded = jwt.decode(token)
  db.prepare('INSERT INTO auth_sessions (id,account_id,expires_at) VALUES (?,?,?)').run(sessionId, row.id, decoded.exp)
  return { token, user: publicAccount(row), expiresIn: lifetime }
}
const dummyHash = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 10)

export function requireAuth (req, res, next) {
  try {
    const authorization = req.get('authorization') || ''
    check(/^Bearer [^ ]+$/.test(authorization), 401, 'UNAUTHENTICATED', 'Please log in')
    let decoded
    try {
      decoded = jwt.verify(authorization.slice(7), secret, { algorithms: ['HS256'], issuer, audience })
    } catch {
      check(false, 401, 'UNAUTHENTICATED', 'Session expired or invalid; please log in')
    }
    const session = db.prepare('SELECT * FROM auth_sessions WHERE id = ?').get(decoded.jti)
    const account = accountById(Number(decoded.sub))
    check(session && session.account_id === account?.id && session.revoked === 0 && session.expires_at > Math.floor(Date.now() / 1000) && account.active === 1,
      401, 'UNAUTHENTICATED', 'Session expired or invalid; please log in')
    req.user = publicAccount(account)
    req.sessionId = session.id
    next()
  } catch (error) { next(error) }
}

export const roles = (...allowed) => (req, res, next) => {
  try {
    check(req.user && allowed.includes(req.user.role), 403, 'FORBIDDEN', 'This action is not permitted for your role')
    next()
  } catch (error) { next(error) }
}

export function signOut (sessionId) {
  db.prepare('UPDATE auth_sessions SET revoked = 1 WHERE id = ?').run(sessionId)
}

function accountValues (body, existing) {
  const name = body.name === undefined ? existing?.name : text(body.name, 'name', 2, 100)
  const email = body.email === undefined ? existing?.email : text(body.email, 'email', 3, 254).toLowerCase()
  check(typeof name === 'string' && typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 400, 'INVALID_INPUT', 'Provide a name and valid email')
  const role = body.role === undefined ? existing?.role : body.role
  check(['USER', 'ANALYST', 'ADMIN'].includes(role), 400, 'INVALID_INPUT', 'Choose USER, ANALYST or ADMIN')
  const active = body.active === undefined ? (existing ? existing.active === 1 : true) : body.active
  check(typeof active === 'boolean', 400, 'INVALID_INPUT', 'active must be a boolean')
  const duplicate = db.prepare('SELECT id FROM accounts WHERE email = ? COLLATE NOCASE AND id != ?').get(email, existing?.id || -1)
  const analystDuplicate = db.prepare('SELECT id FROM analysts WHERE email = ? COLLATE NOCASE AND id != ?').get(email, existing?.id || -1)
  check(!duplicate && !analystDuplicate, 409, 'DUPLICATE_EMAIL', 'Email already exists')
  let passwordHash = existing?.password_hash
  if (body.password !== undefined) {
    check(typeof body.password === 'string' && body.password.length >= 12 && Buffer.byteLength(body.password, 'utf8') <= 72,
      400, 'INVALID_PASSWORD', 'Password must contain at least 12 characters and at most 72 UTF-8 bytes')
    passwordHash = bcrypt.hashSync(body.password, 10)
  }
  check(passwordHash, 400, 'INVALID_PASSWORD', 'An initial password is required')
  return { name, email, role, active: active ? 1 : 0, passwordHash }
}

function syncAnalyst (accountId, values) {
  const exists = db.prepare('SELECT id FROM analysts WHERE id = ?').get(accountId)
  if (exists) db.prepare('UPDATE analysts SET name = ?, email = ?, role = ?, active = ? WHERE id = ?').run(values.name, values.email, values.role, values.active, accountId)
  else if (values.role === 'ANALYST') db.prepare('INSERT INTO analysts (id,name,email,role,active) VALUES (?,?,?,?,?)').run(accountId, values.name, values.email, values.role, values.active)
}

export const createAccount = db.transaction(body => {
  const values = accountValues(body)
  const accountId = db.prepare('SELECT MAX(id) + 1 AS next FROM (SELECT id FROM accounts UNION ALL SELECT id FROM analysts)').get().next || 1
  db.prepare('INSERT INTO accounts (id,name,email,password_hash,role,active) VALUES (?,?,?,?,?,?)')
    .run(accountId, values.name, values.email, values.passwordHash, values.role, values.active)
  syncAnalyst(accountId, values)
  return publicAccount(accountById(accountId))
})

export const updateAccount = db.transaction((value, body) => {
  const accountId = id(value)
  const existing = accountById(accountId)
  check(existing, 404, 'ACCOUNT_NOT_FOUND', 'Account not found')
  const values = accountValues(body, existing)
  if (existing.role === 'ADMIN' && existing.active === 1 && (values.role !== 'ADMIN' || values.active === 0)) {
    const remaining = db.prepare("SELECT COUNT(*) AS n FROM accounts WHERE role = 'ADMIN' AND active = 1 AND id != ?").get(accountId).n
    check(remaining > 0, 409, 'LAST_ADMIN', 'The last active administrator cannot be deactivated or demoted')
  }
  if ((values.role !== 'ANALYST' || values.active === 0) && existing.role === 'ANALYST') {
    const open = db.prepare("SELECT COUNT(*) AS n FROM incidents WHERE assigned_analyst_id = ? AND status NOT IN ('CLOSED','REJECTED')").get(accountId).n
    check(open === 0, 409, 'OPEN_ASSIGNMENTS', 'Reassign open incidents before changing this analyst')
  }
  db.prepare('UPDATE accounts SET name=?,email=?,password_hash=?,role=?,active=? WHERE id=?')
    .run(values.name, values.email, values.passwordHash, values.role, values.active, accountId)
  syncAnalyst(accountId, values)
  if (body.password !== undefined) db.prepare('UPDATE auth_sessions SET revoked = 1 WHERE account_id = ?').run(accountId)
  return publicAccount(accountById(accountId))
})
