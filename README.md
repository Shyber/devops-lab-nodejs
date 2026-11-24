# Cyber Incident Reporting System — current project

The current version extends the four members' Lab5/Lab6 work with authenticated
accounts, ownership, comments, private notes and the full incident workflow.
Olivia's SQLite persistence and incident CRUD remain in place.

## Launch

Use Node.js 24: `npm ci`, then `npm start`. On Windows use `npm.cmd` if required.
Open **http://127.0.0.1:3000/app/**. `PORT` and `DB_PATH` select the port and SQLite
file. Data survives restarts. `npm run db:reset` deliberately restores fictional
data/accounts and clears sessions; do not run it on a database you need to preserve.

## Fictional local accounts

| Role | Email |
| --- | --- |
| Campus user | `campus.user@example.test` |
| Another campus user | `other.user@example.test` |
| Analyst | `maya.chen@example.test` |
| Second analyst | `leo.martin@example.test` |
| Administrator | `admin@example.test` |

Initial demo password: `CampusDemo2026!`. `CIRS_DEMO_PASSWORD` affects initial
seeding, not existing passwords. Nora's inactive account cannot log in. Admins
create accounts with an initial password. The legacy analyst-directory POST
creates an account with an undisclosed random password; an admin sets its usable
password through Accounts. These fixtures are not credentials for real services.

Passwords use bcrypt. Signed JWT sessions last 30 minutes, remain in frontend
memory only, and are revoked on logout. Refresh requires login. Every API request
checks the account's current role and active state. A random signing secret is
persisted locally, or supplied using `JWT_SECRET`.

## Validate and understand

```sh
npm run lint
npm run test:coverage
npm run practice
npm run modules
npm run test:postman
npm run test:browser
```

Postman changes fictional data: run the new Lab6 collection only against a fresh
isolated demonstration server, with its `baseUrl` set appropriately. Older Lab5
collections are historical, pre-authentication material. Browser smoke runs
against a separate server (default http://127.0.0.1:31990) with installed Chrome
and Edge; it does not prove Firefox compatibility or a human usability study.

See [current architecture and API](docs/PROJECT_V1.md),
[acceptance verification](docs/ACCEPTANCE.md), and
[authenticated Postman collection](postman/CIRS_Lab6_Full.postman_collection.json).
The frontend is a separate static JavaScript module rather than the proposed React
implementation; SQLite continues the merged Lab6 choice instead of replacing it
with the initially proposed PostgreSQL stack.

Accounts and categories are deactivated rather than deleted, following Lab2.
Comments/history are append-only. Incident content supports GET/POST/PUT/DELETE.
The UI exposes the report-to-triage workflow with current permissions.

Existing contributions and [provenance](docs/PROVENANCE.md) are preserved.
Software completion does not attest historical meetings, daily board practice or
an actual DVL submission. The earlier README below describes its dated Lab5 stage.

---

## Historical Lab5 README (superseded for running the current project)

> Integration stage: shared foundation and Yuba's analyst directory.
> Exercises, shared fixtures/validation, categories, utility routes and Analysts
> are available. Incident, assignment and metrics routes are still pending.
> See [current integration status](docs/INTEGRATION_STATUS.md).
> Earlier full-kit results describe the prepared four-component target.

This project applies Lab5 to the Cyber Incident Reporting System. It includes the
JavaScript exercises, an Express API, Vitest/Supertest tests and Postman collections.
The four member packages share one SQLite database. All example data is fictional.

## Start the assembled project

Use Node.js 24 and npm. Open a terminal in this folder:

```powershell
npm.cmd ci
npm.cmd run practice
npm.cmd run modules
npm.cmd run lint
npm.cmd run test:coverage
npm.cmd start
```

On Linux/macOS use `npm` instead of `npm.cmd`. The server listens at
http://127.0.0.1:3000. Stop it with Ctrl+C. Data is saved in `data/cirs.db` and
survives restarts. On first start the demonstration data is loaded; run
`npm run db:reset` to restore it at any time. Set `DB_PATH` to use another file.
If port 3000 is already used, stop your previous lab server or set `$env:PORT=3001`
before starting and update the Postman `baseUrl` variable.

SQLite is embedded through `better-sqlite3`: no database server, Docker, login or
secret is needed. Tests use a separate in-memory database for each test file.
Authentication, authorization and the full CIRS workflow are later work.
The analyst endpoint manages a demonstration directory, not real user accounts.

## Explore the work

| Part | Files or command |
| --- | --- |
| Exercises 2.1-2.4, 2.6-2.7 | `js-practice.js`, `npm run practice` |
| Exercise 2.5, modules | `cirsData.js`, `main.js`, `npm run modules` |
| Shared fixtures and validation | `src/data/cirsStore.js`, `src/utils/validation.js` |
| Analysts, Yuba's integration component | `src/routes/auto/analysts.route.js`, `test/analysts.test.js` |
| Incidents, Olivia's integration component | `src/routes/auto/incidents.route.js`, `test/incidents.test.js` |
| Assignments, Sid Ahmed's integration component | `src/routes/auto/assignments.route.js`, `test/assignments.test.js` |
| Metrics, Kandarp's integration component | `src/routes/auto/metrics.route.js`, `test/metrics.test.js` |
| Postman | `postman/`, see [Postman guide](docs/POSTMAN.md) |
| API rules | [API contract](docs/API.md) |
| Package order and GitHub | [Integration guide](docs/INTEGRATION.md) |
| Requirements and Jira | [Scope](docs/SCOPE.md), [Jira mapping](docs/JIRA.md) |
| Authors and preparation | [Provenance](docs/PROVENANCE.md) |

The dependency lockfile is kept from the starting repository. `.npmrc` preserves
its existing peer-dependency setting. The current CI uses Node 24, `npm ci`, both
exercise commands, lint and coverage. The configured minimum is 80% for statements,
branches, functions and lines. Open `coverage/index.html` after the coverage command.
