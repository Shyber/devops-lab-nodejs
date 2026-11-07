# API contract

Base URL: `http://127.0.0.1:3000`. JSON POST requests use `Content-Type: application/json`.
Success responses are plain objects or arrays. Errors contain `error`, `code` and
`message`. Malformed JSON, arrays as request bodies and unknown fields are rejected.
The JSON body limit is 32 KB. IDs are positive safe integers; booleans, arrays,
fractions and ambiguous strings are rejected.

| Method and path | Input | Result |
| --- | --- | --- |
| GET `/` | None | 200, CIRS teaching API message |
| GET `/health` | None | 200, text `OK` |
| GET `/api/categories` | None | 200, five active BRD categories |
| GET `/api/analysts` | Optional `active=true`, `false` or `all`; default true | 200, analyst array |
| GET `/api/analysts/:id` | Existing ID | 200 object, or 404 |
| POST `/api/analysts` | `name`, `email`, optional boolean `active` | 201 and Location; role fixed to ANALYST |
| GET `/api/incidents` | Optional `status`, `priority`, `category` or `categoryId` | 200 array, newest first; filters combined with AND |
| GET `/api/incidents/:id` | Existing ID | 200 object, or 404 |
| POST `/api/incidents` | `title`, `description`, `categoryId` | 201 and Location |
| GET `/api/assignments` | Optional `incidentId` | 200 array of incidentId, analystId and status |
| POST `/api/assignments` | `incidentId`, `analystId` | 201 first assignment; 200 reassignment or repeated same assignment |
| GET `/api/metrics` | No filters | 200, the six SCRUM-14 fields |
| POST `/api/metrics` | Any JSON object | 405 and Allow: GET; computed metrics cannot be edited |

`/api/responses` is a GET/POST compatibility alias for `/api/assignments`, following
the wording of PR16. It uses the same incident records. It does not create reports.
The baseline utility routes `/info`, `/version` and `/boom` remain; `/boom` is a
deliberate teaching error route and returns a generic 500 message.

## Validation and changes

Analyst names contain 2-100 trimmed characters. Emails contain 3-254 characters,
use a basic email format check, and are normalized to lowercase. Duplicates return
409. This is classroom validation, not email ownership verification.

Incident titles contain 5-120 trimmed characters and descriptions 20-5000.
The category must exist (otherwise 404) and be active (otherwise 400). New incidents
start REPORTED, MEDIUM and unassigned. The server uses the fixed demo reporter 100,
generates the ID/timestamps and records a creation entry. Client attempts to set
reporterId, priority, status or assignedAnalystId return 400.

Statuses: REPORTED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REJECTED.
Priorities: LOW, MEDIUM, HIGH, CRITICAL. Enum values are case-sensitive.
Categories: 1 Phishing, 2 Suspicious Link, 3 Compromised Account, 4 Malware, 5 Other.
Category 6 is an inactive test fixture. Do not send category and categoryId together.
No matches returns an empty array. Invalid enum/filter input returns 400.

Assignments require an existing incident and an existing active ANALYST. Missing
records return 404, invalid IDs or inactive/wrong-role targets return 400. CLOSED and
REJECTED incidents are read-only (409). A first assignment changes REPORTED to
ASSIGNED. Reassignment preserves the current non-final status, including RESOLVED.
The same assignment is a no-op. Successful changes update the existing incident and
append history with the fixed demo operator 1. They never create a new incident.

## Metrics and fixtures

| Field | Meaning |
| --- | --- |
| system | Cyber Incident Reporting System |
| status | Operational: API availability, not a security verdict |
| activeIncidents | Incidents whose status is neither CLOSED nor REJECTED; RESOLVED still counts |
| criticalAlerts | Active incidents with priority CRITICAL |
| onlineAnalysts | Unique online IDs in the fictional presence fixture intersected with active ANALYST records |
| systemUptime | Current Node process uptime in seconds |

On a fresh start there are 6 incidents, 4 active incidents, 2 critical alerts,
3 directory analysts (2 active) and 1 online active analyst. Adding a directory
entry does not sign it in. Presence is fictional, not measured production sessions.
Seed history arrays are empty because the seeds are snapshots. They do not claim
that investigations happened. New API writes have demonstration history entries.
