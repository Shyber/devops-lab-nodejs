// 2.1 Variables
const systemName = 'Cyber Incident Reporting System'
const activeAlerts = 5
const isOnline = true
if (isOnline) console.log(`Welcome to ${systemName}! We have ${activeAlerts} active alerts.`)

// 2.2 Arrays and Loops
const analysts = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']
for (const [index, analyst] of analysts.entries()) {
  console.log(`Analyst #${index + 1}: ${analyst}`)
}
analysts.push('Frank')

// 2.3 Objects and Nested Data
const incident = {
  id: 101,
  title: 'Suspicious Login',
  severity: 'High',
  indicators: ['Failed logins', 'Foreign IP'],
  analyst: { name: 'Alice', clearance: 'Level 3' }
}
incident.indicators.push('Disabled MFA')
console.log('Updated Incident:', incident)

// 2.4 Functions and Array Filtering
const incidents = [
  { id: 1, type: 'Phishing', severity: 'Low' },
  { id: 2, type: 'Ransomware', severity: 'Critical' }
]
const filterBySeverity = (level) => incidents.filter(inc => inc.severity === level)
console.log('Critical Incidents:', filterBySeverity('Critical'))

// 2.6 Error Handling
function createReport (type, severity) {
  if (!type || !severity) throw new Error('Missing required fields')
  return { type, severity, date: new Date() }
}
try {
  createReport('Malware')
} catch (err) {
  console.error('Error:', err.message)
}

// 2.7 Async Code
function getSystemStatus () {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ system: 'CIRS', uptime: 99.9 }), 1000)
  })
}
async function showStatus () {
  const data = await getSystemStatus()
  console.log('Data loaded:', data)
}
showStatus()
