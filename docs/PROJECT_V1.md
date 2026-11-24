# CIRS project v1

This local application implements the campus incident-reporting project described in Lab2. It continues the existing CIRS API and Olivia's SQLite work rather than replacing their Git history. Earlier Lab5 reports and their in-memory examples describe their dated snapshots; use the current source, API contracts and fresh verification records for the present delivery.

## Architecture

- `src/app.js` assembles the Express API, authenticates protected `/api` requests, mounts the static frontend at `/app`, and returns structured errors.
- `src/data/db.js` opens an embedded SQLite database with foreign-key enforcement. The default path is `data/cirs.db`; `DB_PATH` selects another database. Database files and the generated authentication secret remain under the git-ignored data directory.
- `src/data/cirsStore.js` provides transactional incident data access. An assignment updates an existing incident; it does not create a second report. History entries and their associated updates are committed together.
- `src/security/auth.js` manages accounts, password hashes, signed sessions and role checks. `src/security/access.js` checks access to individual reports.
- `public/` contains the browser interface, with frontend JavaScript separate from backend modules. It stores the JWT in memory rather than browser persistence. Refreshing the page requires login again.

Lab2 describes React/Express/PostgreSQL as a **proposed** stack. This implementation retains the delivered SQLite database and uses a small vanilla JavaScript frontend served by Express. These are explicit implementation choices: they keep the local demonstration reproducible without a separate database server or frontend build step. They are not a claim that React or PostgreSQL was implemented.

## Run locally

Use Node.js 24 to match the CI environment.

```text
npm ci
npm start
```

Open `http://127.0.0.1:3000/app/`. The server binds to loopback for the local demonstration. `PORT` changes the port, and `DB_PATH` changes the SQLite file. `npm run dev` starts the server with Node's watch mode. On PowerShell use `npm.cmd` if the `.ps1` launcher is restricted.

The first launch initialises the schema and fictional sample records. Saved records survive a restart. To deliberately replace the local demo data, accounts and sessions:

```text
npm run db:reset
```

This reset is destructive to the selected **local demonstration database**. It is a deliberate command, not a startup action. Ordinary restarts preserve existing incident and account records. Tests use `DB_PATH=:memory:` and do not erase the working demonstration database.

## Fictional demonstration accounts

These addresses and people are sample fixtures, not university login credentials. The common initial password is `CampusDemo2026!`; set `CIRS_DEMO_PASSWORD` **before first initialisation or an explicit reset** to use another demo password. Changing that environment variable does not silently replace existing passwords.

| Email | Role | State |
| --- | --- | --- |
| `campus.user@example.test` | USER | Active; owns seeded reports |
| `other.user@example.test` | USER | Active; separate owner for privacy checks |
| `maya.chen@example.test` | ANALYST | Active |
| `leo.martin@example.test` | ANALYST | Active |
| `nora.silva@example.test` | ANALYST | Inactive; login must be refused |
| `admin@example.test` | ADMIN | Active |

The administrator creates additional accounts. There is no self-registration or password-recovery flow. The legacy analyst-creation endpoint creates a corresponding ANALYST account with a random, undisclosed initial password; the administrator must set a known password through account management before that account can be used to log in. No generated initial password is returned by the API or recorded in documentation.

Historical directory-only ANALYST records are given matching account IDs by an additive migration when there is no existing ID or email collision. Their initial passwords are also random and undisclosed. Existing accounts are never overwritten. If historical IDs or emails collide, the old directory record is not silently converted into another person's account and cannot be selected as an active authenticated assignment target. The administrator can create a fresh proper account and reassign work. Fictional directory entries do not represent actual people or university accounts.

## Sessions and permissions

Passwords are stored as bcrypt hashes. Login issues an HS256 JWT with a 30-minute lifetime, issuer/audience restrictions and a persisted session ID. A random signing secret is generated and retained in the local database, unless `JWT_SECRET` is supplied. No fixed signing secret is committed. The database itself must be protected like other local application data.

Every protected API request checks the JWT, session expiration/revocation, and the account's current active state and role. Logout revokes the session server-side. Password replacement revokes that account's previous sessions. A deactivated account or changed role is enforced on the next request, including requests carrying an older token.

USER accounts report incidents and view their own reports, public comments and history. Foreign report IDs return the same missing-report response as absent IDs. ANALYST and ADMIN accounts can perform IT review actions; ADMIN additionally manages accounts and categories. Assignment targets must be active ANALYST records. Public responses never include password hashes.

Accounts are **deactivated rather than deleted**, as required by the Lab2 SRS, preserving past reports and comments. An analyst with open assignments must have them reassigned before deactivation or role change. The last active administrator cannot be deactivated or demoted. Comments and history are likewise not general-purpose mutable CRUD resources; their domain rules govern the allowed operations.

## Requirements and verification map

| Requirement / Jira area | Implementation and evidence to check |
| --- | --- |
| SRS FR-01, SCRUM-10 | Login/logout forms and API, bcrypt, JWT expiration, revocation and live account checks; `test/auth.test.js` |
| SRS FR-08, SCRUM-11 | Administrator account API and interface, current roles, last-admin and open-assignment safeguards; `test/auth.test.js` |
| SRS FR-02/03, SCRUM-12/13 | Guided report creation, server-owned reporter and defaults, My Reports and per-ID ownership checks; incident and privacy tests |
| SRS FR-04/05/06/10, SCRUM-8 | Incident queue, combined filters, active-analyst assignment, explicit priority and lifecycle rules; workflow tests |
| SRS FR-07/09, SCRUM-16/17/18/19 | Public comments, IT-only notes, read-only history and final-state protections; workflow and privacy tests |
| SRS FR-08, SCRUM-20 | Admin category creation, rename and deactivation without deleting old reports; workflow tests |
| SRS NFR-07, SCRUM-33 | SQLite persistence and an independent create/restart/read scenario |

Run the automated checks against the current source:

```text
npm run lint
npm test -- --coverage
npm run practice
npm run modules
```

Vitest/Supertest integration tests exercise real login tokens and verify both successful and rejected operations. They supplement the UI checks; they do not prove a user study, a team meeting, actual submission, or browser compatibility by themselves. Browser names, versions and tested scenarios must be recorded only after the corresponding browsers have really been exercised. In particular, do not claim Chrome, Firefox and Edge testing from a single Chromium run.

The retained old Postman collections and old screenshots remain historical evidence until replayed against the present authenticated API. Use current demonstration tokens and a freshly reset isolated database for a reproducible replay. Do not rename an old screenshot to make it look like a new execution.
