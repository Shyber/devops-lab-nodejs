import app from './app.js'

const port = Number(process.env.PORT || 3000)
// Lab5 has fictional data and no authentication. Bind locally for the demonstration.
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`[CIRS Lab5] http://127.0.0.1:${port} - in-memory demonstration`)
})
server.on('error', error => {
  console.error(`[CIRS Lab5] Server failed: ${error.code}`)
  process.exitCode = 1
})
