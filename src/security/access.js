import { findIncident } from '../data/cirsStore.js'
import { check } from '../utils/validation.js'

export function accessibleIncident (req, incidentId) {
  const incident = findIncident(incidentId)
  // A foreign ID has the same response as a missing ID: no report data leaks.
  check(req.user.role !== 'USER' || incident.reporterId === req.user.id,
    404, 'INCIDENT_NOT_FOUND', 'Incident not found')
  return incident
}
