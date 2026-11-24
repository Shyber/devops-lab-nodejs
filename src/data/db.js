// SQLite connection and schema for CIRS.
// DB_PATH selects the database file; ':memory:' gives a throwaway database (used by tests).
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const dbPath = process.env.DB_PATH || path.join(projectRoot, 'data', 'cirs.db')

if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)
if (dbPath !== ':memory:') db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS analysts (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS analyst_presence (
    analyst_id INTEGER PRIMARY KEY REFERENCES analysts(id) ON DELETE CASCADE,
    online INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    reporter_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    assigned_analyst_id INTEGER REFERENCES analysts(id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS incident_history (
    id INTEGER PRIMARY KEY,
    incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    actor_id INTEGER NOT NULL,
    old_value TEXT,
    new_value TEXT,
    at TEXT NOT NULL
  );
`)
