import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Each test file runs in its own worker with a fresh in-memory database.
    env: { DB_PATH: ':memory:' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js', 'cirsData.js'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 80 }
    }
  }
})
