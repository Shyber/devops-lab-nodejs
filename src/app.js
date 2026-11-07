import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { errorHandler } from './utils/errorHandler.js'

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '32kb' }))
app.use((req, res, next) => {
  if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: true, code: 'INVALID_INPUT', message: 'Expected a JSON object' })
  }
  next()
})
app.get('/', (_req, res) => res.json({ ok: true, message: 'CIRS Lab5 teaching API' }))
app.get('/health', (_req, res) => res.status(200).send('OK'))

// Keep the previous lab's router discovery so member files can be added independently.
const autoDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'routes', 'auto')
for (const file of fs.readdirSync(autoDir).filter(file => file.endsWith('.route.js')).sort()) {
  const { default: router } = await import(pathToFileURL(path.join(autoDir, file)).href)
  app.use('/', router)
}
app.use((_req, res) => res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Route not found' }))
app.use(errorHandler)
export default app
