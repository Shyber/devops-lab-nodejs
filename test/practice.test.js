import { it, expect } from 'vitest'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { analysts, incidents, addAnalyst, findIncident } from '../cirsData.js'
const run = promisify(execFile)

it('executes all JavaScript practice sections, including the expected error and await result', async () => {
  const result = await run(process.execPath, ['js-practice.js'])
  for (let section = 1; section <= 7; section++) expect(result.stdout).toContain(`2.${section}`)
  for (const output of ['offline', 'Analyst #5:', 'Updated count: 6', 'Analyst found', 'Analyst not found',
    'Indicator count: 2', 'Updated incidents:', 'Valid assignment:', 'Expected error: Missing required fields',
    'Fetching CIRS data...', 'Data loaded:']) expect(result.stdout).toContain(output)
  expect(result.stderr).toBe('')
})
it('runs main.js using the exported arrays and functions', async () => {
  const result = await run(process.execPath, ['main.js'])
  expect(result.stdout).toContain('2.5 - Updated analysts:')
  expect(result.stdout).toContain('Nora Silva')
  expect(result.stdout).toContain('Incident count: 2')
})
it('uses and validates the standalone module functions', () => {
  const original = [...analysts]
  try {
    addAnalyst('  Alex Morgan  ')
    expect(analysts.at(-1)).toBe('Alex Morgan')
    expect(findIncident(2)).toBe(incidents[1])
    expect(findIncident(999)).toBeUndefined()
    expect(() => addAnalyst(' ')).toThrow('Analyst name is required')
    expect(() => addAnalyst(7)).toThrow('Analyst name is required')
  } finally {
    analysts.splice(0, analysts.length, ...original)
  }
})
