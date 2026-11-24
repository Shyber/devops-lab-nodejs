import express from 'express'
import { findIncident, getAnalyst, assignIncident, listAssignedIncidents } from '../../data/cirsStore.js'
import { check, fields, id, isFinal } from '../../utils/validation.js'

const router = express.Router()
// /responses is a compatibility alias for the wording of PR #16.
// Both URLs operate on incidents; there is no second incident or responses table.
const paths = ['/api/assignments', '/api/responses']
const assignmentView = item => ({ incidentId: item.id, analystId: item.assignedAnalystId, status: item.status })

router.get(paths, (req, res) => {
  fields(req.query, ['incidentId'])
  const records = req.query.incidentId === undefined
    ? listAssignedIncidents()
    : [findIncident(req.query.incidentId)].filter(item => item.assignedAnalystId !== null)
  res.json(records.map(assignmentView))
})

router.post(paths, (req, res) => {
  fields(req.body, ['incidentId', 'analystId'])
  const incident = findIncident(req.body.incidentId)
  const analystId = id(req.body.analystId)
  const analyst = getAnalyst(analystId)
  check(analyst, 404, 'ANALYST_NOT_FOUND', 'Analyst not found')
  check(analyst.active && analyst.role === 'ANALYST', 400, 'INVALID_ANALYST', 'Choose an active ANALYST account')
  check(!isFinal(incident.status), 409, 'FINAL_INCIDENT', 'Closed and Rejected incidents are read-only')
  const firstAssignment = incident.assignedAnalystId === null
  const updated = assignIncident(incident, analystId)
  res.status(firstAssignment ? 201 : 200).json(assignmentView(updated))
})

export default router
