import app from './app.js'
import { dbPath } from './data/db.js'

const port = Number(process.env.PORT || 3000)
// Fictional data and no authentication yet. Bind locally for the demonstration.
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`[CIRS] http://127.0.0.1:${port} - SQLite database: ${dbPath}`)
})
server.on('error', error => {
  console.error(`[CIRS] Server failed: ${error.code}`)
  process.exitCode = 1
})
