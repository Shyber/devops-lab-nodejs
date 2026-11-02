export const doctors = ['Dr. Lee', 'Dr. Khan', 'Dr. Smith', 'Dr. Ali', 'Dr. Martin']

export function addDoctor (name) {
  doctors.push(name)
}

export function findDoctor (name) {
  return doctors.includes(name) ? 'Doctor found' : 'Doctor not found'
}
