# CIRS - Lab5

> Integration stage: shared foundation only. This branch provides the exercises,
> shared fixtures/validation, categories and utility routes. Member API routes are
> integrated in later PRs. See [current integration status](docs/INTEGRATION_STATUS.md).
> The complete-project guides and earlier full-kit results describe the prepared target.

This project applies Lab5 to the Cyber Incident Reporting System. It includes the
JavaScript exercises, an Express API, Vitest/Supertest tests and Postman collections.
The four member packages share one in-memory data store. All example data is fictional.

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
http://127.0.0.1:3000. Stop it with Ctrl+C. A restart restores the initial fixtures.
If port 3000 is already used, stop your previous lab server or set `$env:PORT=3001`
before starting and update the Postman `baseUrl` variable.

No database, Docker, login or secret is needed. This is the Lab5 teaching scope.
Authentication, authorization, persistence and the full CIRS workflow are later work.
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
