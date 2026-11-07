# Lab5 scope and requirements

The Lab5 PDF and the CIRS BRD, SRS and SDD are the source requirements. This delivery
implements their relevant data rules using the Lab5 in-memory Express architecture.
It does not claim that the complete SRS, Lab6 or every related Jira story is finished.

| Lab section | CIRS adaptation | Verification |
| --- | --- | --- |
| 2.1 Variables | const system name/count, let online, then offline branch | practice output and test/practice.test.js |
| 2.2 Arrays | five analyst names, indexed for-of, push, count, found/not found | practice output and script test |
| 2.3 Objects | nested incident/analyst, indicator count, push new indicator | practice output |
| 2.4 Functions | incident array, addIncident, filterByPriority | practice output and script test |
| 2.5 Modules | cirsData exports, main imports and uses them | modules output and module tests |
| 2.6 Errors | three-field assignment example, valid call and caught missing field | practice output and script test |
| 2.7 Async/await | Promise, setTimeout 1000 ms, fetching/data-loaded messages | actual script execution and output test |
| Routes | GET/POST components, validation and structured errors | Supertest and Postman |
| Tests and CI | lint, V8 coverage, minimum 80% on all four metrics | local execution; workflow prepared |
| Postman | GET, POST, rejected writes, read-back, full Runner | 52 requests and 159 passed assertions on 6 November 2026 |

The exercise arrays are intentionally separate from the API store. Their counts
demonstrate JavaScript and are not the values returned by `/api/metrics`.

| CIRS reference | Lab5 implementation | Deferred portion |
| --- | --- | --- |
| FR-02, report an incident | Length bounds, active category, server defaults, POST and read-back | Authenticated reporter and persistent storage |
| FR-03, personal reports | Incident list/detail data | Per-user ownership checks and UI |
| FR-04/FR-10 | Incident list and AND filters | Protected IT dashboard and pagination/UI |
| FR-05 | Assign active analyst to existing incident; reassign; final-state guard | Authentication and role-based caller authorization |
| FR-06 | Initial MEDIUM and REPORTED-to-ASSIGNED transition | General priority/status update endpoints and reason rules |
| FR-08 | Analyst directory and active category lookup | Real accounts, passwords, admin operations, category management |
| FR-09 | Creation and assignment history in memory | Durable audit storage, full history endpoint and access rules |
| SCRUM-14/15 | Exact metrics schema, calculated counts, tests and collection | Real login presence and production monitoring |

JWT, password hashing, PostgreSQL, Docker database setup, comments/internal notes,
production security and the complete workflow from the Lab6 kit were not activated.
No automatic severity scoring is introduced. High and Critical seeds are explicit
fictional examples; new reports always start Medium.
