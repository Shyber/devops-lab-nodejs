import { doctors, addDoctor, findDoctor } from './hospitalData.js'

// 2.1 Variables and data types
const hospitalName = 'Central Hospital'
let numberOfDoctors = doctors.length
let isOpen = true
console.log(`Welcome to ${hospitalName}! We have ${numberOfDoctors} doctors currently available.`)
console.log('Hospital open:', isOpen)
isOpen = false
if (!isOpen) console.log('The hospital is closed.')

// 2.2 Arrays and loops
let index = 1
for (const doctor of doctors) console.log(`Doctor #${index++}: ${doctor}`)
addDoctor('Dr. Julie')
numberOfDoctors = doctors.length
console.log('Updated count:', numberOfDoctors)
console.log(findDoctor('Dr. Lee'))
console.log(findDoctor('Dr. Unknown'))

// 2.3 Objects and nested data
const patient = {
  name: 'Alice Martin',
  age: 34,
  conditions: ['diabetes', 'hypertension'],
  doctor: { name: 'Dr. Lee', specialty: 'Cardiology' }
}
console.log('Doctor:', patient.doctor.name)
console.log('Conditions:', patient.conditions.length)
console.log(`${patient.name} is treated by ${patient.doctor.name} (${patient.doctor.specialty}).`)
patient.conditions.push('anxiety')
console.log(patient)

// 2.4 Functions and filtering
const patients = [
  { id: 1, name: 'Alice', age: 34 },
  { id: 2, name: 'John', age: 45 },
  { id: 3, name: 'Marie', age: 29 }
]
function filterByAge (minAge) {
  return patients.filter(patient => patient.age > minAge)
}
function addPatient (name, age) {
  patients.push({ id: patients.length + 1, name, age })
}
console.log('Older than 30:', filterByAge(30))
addPatient('Sam', 22)
console.log('Updated patients:', patients)

// 2.5 See hospitalData.js and main.js for a separate import/export example.

// 2.6 Errors and validation
function createAppointment (doctor, patient, date) {
  if (!doctor || !patient || !date) throw new Error('Missing required fields')
  return { doctor, patient, date }
}
try {
  console.log(createAppointment('Dr. Lee', 'Alice', '2026-11-02'))
  console.log(createAppointment('Dr. Lee'))
} catch (err) {
  console.error('Error:', err.message)
}

// 2.7 Promises and async/await
function getHospitalData () {
  return new Promise(resolve => {
    setTimeout(() => resolve({ name: hospitalName, uptime: 1234 }), 1000)
  })
}
async function showData () {
  console.log('Fetching hospital data...')
  const data = await getHospitalData()
  console.log('Data loaded:', data)
}
await showData()
