import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js', 'cirsData.js'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 80 }
    }
  }
})
