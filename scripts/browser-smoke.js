import { chromium, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const base = process.env.CIRS_URL || 'http://127.0.0.1:31990'
const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../evidence/browser')
const password = process.env.CIRS_DEMO_PASSWORD || 'CampusDemo2026!'
const results = { at: new Date().toISOString(), viewport: { width: 1366, height: 768 }, base, browsers: [], limitations: ['Firefox is not installed; this run covers installed Chrome and Edge only.'] }
await fs.mkdir(output, { recursive: true })

for (const channel of ['chrome', 'msedge']) {
  const result = { channel, checks: [], errors: [] }
  results.browsers.push(result)
  let browser
  let page
  try {
    browser = await chromium.launch({ channel, headless: true })
    result.version = browser.version()
    page = await browser.newPage({ viewport: results.viewport })
    page.on('pageerror', error => result.errors.push(error.message))
    const mark = name => result.checks.push({ name, passed: true })
    const login = async email => {
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
      await page.getByLabel('Email address', { exact: true }).fill(email)
      await page.getByLabel('Password', { exact: true }).fill(password)
      await page.getByRole('button', { name: 'Sign in →', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()
    }
    const logout = async () => {
      await page.getByRole('button', { name: 'Sign out', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    }
    const unique = `${channel}-${Date.now()}`
    const title = `Fictional campus report ${unique}`
    await page.goto(base + '/app/')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await page.screenshot({ path: path.join(output, `${channel}-login.png`) })
    await login('campus.user@example.test')
    await expect(page.getByRole('heading', { name: 'My reports', exact: true })).toBeVisible()
    mark('Campus user login and My Reports')

    await page.getByRole('navigation').getByRole('button', { name: 'Report an incident', exact: true }).click()
    await page.getByLabel('Title', { exact: true }).fill('      ')
    await page.getByLabel('Description', { exact: true }).fill('                              ')
    await page.getByLabel('Category', { exact: true }).selectOption('1')
    await page.getByRole('button', { name: 'Submit report', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('After trimming')
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue('      ')
    await expect(page.getByLabel('Description', { exact: true })).toHaveValue('                              ')
    mark('Trimmed invalid form shows error and preserves entered fields')

    await page.getByLabel('Title', { exact: true }).fill(title)
    await page.getByLabel('Description', { exact: true }).fill('Fictional campus security concern used only for the automated local demonstration.')
    await page.getByRole('button', { name: 'Submit report', exact: true }).click()
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    const reference = await page.getByRole('heading', { level: 1 }).textContent()
    result.createdReference = reference
    await expect(page.getByRole('status')).toContainText(reference)
    mark('Valid guided form creates report and displays reference')

    await page.getByRole('navigation').getByRole('button', { name: 'My reports', exact: true }).click()
    await expect(page.getByRole('button', { name: title, exact: true })).toBeVisible()
    await page.screenshot({ path: path.join(output, `${channel}-my-reports.png`), style: '#notice { visibility: hidden !important; }' })
    await logout()
    await login('other.user@example.test')
    await expect(page.getByRole('heading', { name: 'My reports', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: title, exact: true })).toHaveCount(0)
    mark('Another campus user does not see the first user’s report')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    mark('Page refresh discards the in-memory token and requires login')

    await login('maya.chen@example.test')
    await expect(page.getByRole('heading', { name: 'Incident dashboard', exact: true })).toBeVisible()
    await page.getByLabel('Status', { exact: true }).selectOption('REPORTED')
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click()
    await expect(page.getByRole('button', { name: title, exact: true })).toBeVisible()
    await page.screenshot({ path: path.join(output, `${channel}-dashboard.png`), style: '#notice { visibility: hidden !important; }' })
    mark('Analyst dashboard, metrics and status filter')
    await page.getByRole('button', { name: title, exact: true }).click()
    await page.getByLabel('Assigned analyst', { exact: true }).selectOption('1')
    await page.getByRole('button', { name: 'Save assignment', exact: true }).click()
    await expect(page.locator('.badge.assigned')).toBeVisible()
    mark('Analyst assignment updates Reported to Assigned')
    await page.getByLabel('Priority', { exact: true }).selectOption('HIGH')
    await page.getByRole('button', { name: 'Save priority', exact: true }).click()
    await expect(page.locator('.badge.high')).toBeVisible()
    mark('Priority update appears in the report')

    await page.getByLabel('Add a public comment', { exact: true }).fill(`Public browser comment ${unique}`)
    await page.getByRole('button', { name: 'Post comment', exact: true }).click()
    await expect(page.getByText(`Public browser comment ${unique}`, { exact: true })).toBeVisible()
    await page.getByLabel('Add an internal note', { exact: true }).fill(`Internal browser note ${unique}`)
    await page.getByRole('button', { name: 'Add note', exact: true }).click()
    await expect(page.getByText(`Internal browser note ${unique}`, { exact: true })).toBeVisible()
    mark('Public comment and IT-only note created through the UI')

    await page.getByLabel('Next status', { exact: true }).selectOption('IN_PROGRESS')
    await page.getByRole('button', { name: 'Change status', exact: true }).click()
    await expect(page.locator('.badge.in_progress')).toBeVisible()
    await page.getByLabel('Next status', { exact: true }).selectOption('RESOLVED')
    await page.getByLabel('Public explanation', { exact: true }).fill('Fictional issue resolved during browser verification.')
    await page.getByRole('button', { name: 'Change status', exact: true }).click()
    await expect(page.locator('.badge.resolved')).toBeVisible()
    await page.screenshot({ path: path.join(output, `${channel}-incident-detail.png`), fullPage: true, style: '#notice { visibility: hidden !important; }' })
    await page.getByLabel('Next status', { exact: true }).selectOption('CLOSED')
    await page.getByRole('button', { name: 'Change status', exact: true }).click()
    await expect(page.locator('.badge.closed')).toBeVisible()
    await expect(page.getByText('This report is final and read-only.', { exact: false })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Post comment', exact: true })).toHaveCount(0)
    mark('Full Assigned → In Progress → Resolved → Closed workflow; final UI is read-only')

    await logout()
    await login('campus.user@example.test')
    await page.getByRole('button', { name: title, exact: true }).click()
    await expect(page.getByText(`Public browser comment ${unique}`, { exact: true })).toBeVisible()
    await expect(page.getByText(`Internal browser note ${unique}`, { exact: true })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Internal notes', exact: true })).toHaveCount(0)
    mark('Reporter sees public discussion and history, without the internal note')

    await logout()
    await login('admin@example.test')
    await page.getByRole('navigation').getByRole('button', { name: 'Accounts', exact: true }).click()
    const newAccount = page.getByRole('heading', { name: 'Create an account', exact: true }).locator('..')
    await newAccount.getByLabel('Name', { exact: true }).fill(`Browser User ${unique}`)
    await newAccount.getByLabel('Email', { exact: true }).fill(`browser-${unique}@example.test`)
    await newAccount.getByLabel('Initial password', { exact: true }).fill('FictionalBrowserPass2026!')
    await newAccount.getByRole('button', { name: 'Create account', exact: true }).click()
    const accountRow = page.locator('form.admin-item').last()
    await expect(accountRow.getByLabel('Email', { exact: true })).toHaveValue(`browser-${unique}@example.test`)
    await accountRow.getByLabel('Access', { exact: true }).selectOption('false')
    await accountRow.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('Account updated')
    mark('Administrator creates and deactivates an account through the UI')

    await page.getByRole('navigation').getByRole('button', { name: 'Categories', exact: true }).click()
    await page.getByLabel('New category name', { exact: true }).fill(`Browser category ${unique}`)
    await page.getByRole('button', { name: 'Add category', exact: true }).click()
    const categoryRow = page.locator('form.admin-item.category').last()
    await expect(categoryRow.getByLabel('Category name', { exact: true })).toHaveValue(`Browser category ${unique}`)
    await categoryRow.getByLabel('Availability', { exact: true }).selectOption('false')
    await categoryRow.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('Category saved')
    mark('Administrator creates and deactivates a category through the UI')
    await page.screenshot({ path: path.join(output, `${channel}-categories-admin.png`), style: '#notice { visibility: hidden !important; }' })
    await logout()
    result.passed = result.errors.length === 0
  } catch (error) {
    result.passed = false
    result.failure = error.message
    if (page) await page.screenshot({ path: path.join(output, `${channel}-failure.png`), fullPage: true }).catch(() => {})
  } finally {
    if (browser) await browser.close()
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2))
  }
}
console.log(JSON.stringify(results, null, 2))
if (results.browsers.some(result => !result.passed)) process.exitCode = 1
