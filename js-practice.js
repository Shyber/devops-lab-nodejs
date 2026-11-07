// Based on Kandarp Pandya's PR #16. Completed for every Lab5 task (2.1-2.7).
// All values are fictional. Exercise arrays are separate from the API data.
console.log('\n2.1 Variables and data types')
const systemName = 'Cyber Incident Reporting System'
const numberOfAnalysts = 5
let isOnline = true
if (isOnline) console.log(`Welcome to ${systemName}! We have ${numberOfAnalysts} analysts available.`)
isOnline = false
if (!isOnline) console.log(`${systemName} is offline for this exercise.`)

console.log('\n2.2 Arrays and loops')
const analysts = ['Maya', 'Leo', 'Nora', 'Alex', 'Sam']
for (const [index, analyst] of analysts.entries()) {
  console.log(`Analyst #${index + 1}: ${analyst}`)
}
analysts.push('Robin')
console.log('Updated count:', analysts.length)
function findAnalyst (name) {
  return analysts.includes(name) ? 'Analyst found' : 'Analyst not found'
}
console.log(findAnalyst('Maya'))
console.log(findAnalyst('Unknown'))

console.log('\n2.3 Objects and nested data')
const incident = {
  title: 'Suspicious training login',
  priority: 'HIGH',
  indicators: ['Repeated failed logins', 'Unexpected training device'],
  analyst: { name: 'Maya', specialty: 'Account security' }
}
console.log('Analyst name:', incident.analyst.name)
console.log('Indicator count:', incident.indicators.length)
console.log(`${incident.title} is handled by ${incident.analyst.name} (${incident.analyst.specialty}).`)
incident.indicators.push('Unexpected MFA prompt')
console.log('Updated incident:', incident)

console.log('\n2.4 Functions and filtering')
const incidents = [
  { id: 1, title: 'Training phishing email', priority: 'MEDIUM' },
  { id: 2, title: 'Training malware alert', priority: 'CRITICAL' },
  { id: 3, title: 'Training account access', priority: 'HIGH' }
]
const filterByPriority = priority => incidents.filter(item => item.priority === priority)
function addIncident (title, priority) {
  incidents.push({ id: incidents.length + 1, title, priority })
}
addIncident('Training suspicious link', 'LOW')
console.log('Updated incidents:', incidents)
console.log('Critical incidents:', filterByPriority('CRITICAL'))

console.log('\n2.5 Modules: run node main.js to use cirsData.js')

console.log('\n2.6 Validation and error handling')
function createAssignment (analyst, incident, date) {
  if (!analyst || !incident || !date) throw new Error('Missing required fields')
  return { analyst, incident, date }
}
try {
  console.log('Valid assignment:', createAssignment('Maya', 'Existing incident #1', '2026-11-06'))
  createAssignment('Maya')
} catch (error) {
  console.log('Expected error:', error.message)
}

console.log('\n2.7 Async/await')
function getSystemData () {
  return new Promise(resolve => {
    setTimeout(() => resolve({ system: 'CIRS', incidentCount: incidents.length }), 1000)
  })
}
async function showData () {
  console.log('Fetching CIRS data...')
  const data = await getSystemData()
  console.log('Data loaded:', data)
}
await showData()
