// Section 2.5: standalone exercise data, separate from the API store.
export const analysts = ['Maya Chen', 'Leo Martin']
export const incidents = [
  { id: 1, title: 'Training phishing report', priority: 'MEDIUM' },
  { id: 2, title: 'Training malware report', priority: 'CRITICAL' }
]
export function addAnalyst (name) {
  if (typeof name !== 'string' || !name.trim()) throw new Error('Analyst name is required')
  analysts.push(name.trim())
}
export const findIncident = id => incidents.find(item => item.id === id)
