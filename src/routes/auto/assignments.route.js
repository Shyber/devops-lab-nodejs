import express from 'express'
import { store, findIncident, recordChange } from '../../data/cirsStore.js'
import { check, fields, id, isFinal } from '../../utils/validation.js'

const router = express.Router()
// /responses is a compatibility alias for the wording of PR #16.
// Both URLs operate on incidents; there is no second incident or responses table.
const paths = ['/api/assignments', '/api/responses']
const assignmentView = item => ({ incidentId: item.id, analystId: item.assignedAnalystId, status: item.status })

router.get(paths, (req, res) => {
  fields(req.query, ['incidentId'])
  const records = req.query.incidentId === undefined ? store.incidents : [findIncident(req.query.incidentId)]
  res.json(records.filter(item => item.assignedAnalystId !== null).map(assignmentView))
})

router.post(paths, (req, res) => {
  fields(req.body, ['incidentId', 'analystId'])
  const incident = findIncident(req.body.incidentId)
  const analystId = id(req.body.analystId)
  const analyst = store.analysts.find(item => item.id === analystId)
  check(analyst, 404, 'ANALYST_NOT_FOUND', 'Analyst not found')
  check(analyst.active && analyst.role === 'ANALYST', 400, 'INVALID_ANALYST', 'Choose an active ANALYST account')
  check(!isFinal(incident.status), 409, 'FINAL_INCIDENT', 'Closed and Rejected incidents are read-only')
  const firstAssignment = incident.assignedAnalystId === null
  if (incident.assignedAnalystId !== analystId) {
    recordChange(incident, 'ASSIGNED', incident.assignedAnalystId, analystId)
    incident.assignedAnalystId = analystId
    if (incident.status === 'REPORTED') {
      recordChange(incident, 'STATUS_CHANGED', 'REPORTED', 'ASSIGNED')
      incident.status = 'ASSIGNED'
    }
    incident.updatedAt = new Date().toISOString()
  }
  res.status(firstAssignment ? 201 : 200).json(assignmentView(incident))
})

export default router
