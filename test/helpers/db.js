// Test helpers: read or change the database directly.
import { db } from '../../src/data/cirsStore.js'

const tables = ['analysts', 'analyst_presence', 'categories', 'incidents', 'incident_history']

/** Serialises every table, to check that a rejected request changed nothing. */
export const snapshot = () => JSON.stringify(tables.map(table => db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()))

export const run = (sql, ...params) => db.prepare(sql).run(...params)
export const count = table => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n
