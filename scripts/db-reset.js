// Restores the demonstration data in the local database: npm run db:reset
import { resetStore } from '../src/data/cirsStore.js'
import { db, dbPath } from '../src/data/db.js'
import { resetAccounts } from '../src/security/auth.js'

db.transaction(() => {
  resetStore()
  resetAccounts()
})()
console.log(`[CIRS] Fictional demonstration data and accounts restored in ${dbPath}; previous sessions revoked`)
