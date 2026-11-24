// Restores the demonstration data in the local database: npm run db:reset
import { resetStore } from '../src/data/cirsStore.js'
import { dbPath } from '../src/data/db.js'

resetStore()
console.log(`[CIRS] Demonstration data restored in ${dbPath}`)
