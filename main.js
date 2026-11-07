// 2.5 Modularization: import arrays and functions, then use them.
import { analysts, incidents, addAnalyst, findIncident } from './cirsData.js'

addAnalyst('Nora Silva')
console.log('2.5 - Updated analysts:', analysts)
console.log('Incident count:', incidents.length)
console.log('Incident #2:', findIncident(2))
