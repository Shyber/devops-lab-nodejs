# Current project acceptance

Software work covers SCRUM-10/11/12/13/16/17, subtasks 18/19/20 and epics 6–9.

| Scope | Implementation | Verification |
| --- | --- | --- |
| Sessions | Auth module and routes | Signed expiry, logout and password-change revocation, current role, inactive account, generic login failure |
| Accounts | Users route, account/analyst synchronisation | Unique email, last-admin protection, open-assignment protection, no destructive account deletion |
| Reporting and My Reports | Incidents and access module | Authenticated reporter, foreign-ID 404, query spoofing refusal, atomic creation rollback |
| Incident CRUD | Olivia's PUT/DELETE extended with ownership | Validation, no-op, final-state refusal, restricted withdrawal |
| Triage | Assignments and workflow | Full lifecycle, public resolution/rejection reason, disallowed transitions, actor-aware audit |
| Public/private comments | Workflow and comments table | Ownership, IT-only notes, length boundaries, final-state refusal, no edit/delete |
| Audit history | Transactional writes | Actor/time/old/new, rollback on injected audit failure, no note text in public history |
| Categories | Existing list + workflow admin routes | Case-insensitive uniqueness, deactivation preserves existing reports |
| Frontend | Separate public module at /app/ | Actual browser login, reporting and role-based form workflows |
| Persistence | Existing SQLite retained | Isolated databases and explicit reset; restart readback |

`npm run test:coverage` runs the original component contracts with real sessions,
plus direct authorization tests. Production authentication is not bypassed.
The new Postman collection performs a complete authenticated workflow, not the old
pre-authentication Lab5 replay. Chrome/Edge smoke checks create separate browser
contexts against an isolated demo database. CI enforces all four 80% coverage gates.
Exact results belong to their execution output and source SHA.

## Limits requiring real human evidence

Software checks cannot prove past team attendance, daily board use, retrospective
feedback or actual DVL submission. SCRUM-22/24 and SCRUM-32 require these events.
The Lab3 simulation and old Lab5 results retain their original dates and provenance.
No new-tester usability time or three-browser result is inferred from automation.
Firefox was not installed in the Windows environment used for this verification.
