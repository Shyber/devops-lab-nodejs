# Olivia - Incidents integration package

Responsibility: incidents. Prepared by Codex for Yuba; this is not a record
of a commit or execution by Olivia. Review and understand the files before integrating.

Jira: SCRUM-12, SCRUM-13, SCRUM-25/26. Proposed branch: `feature/SCRUM-12-lab5-incidents`.

Add GET list/detail, combined filters and POST incident creation. Enforce SRS title/description limits and active categories, and generate REPORTED/MEDIUM defaults on the server. Personal ownership checks and the full protected UI are deferred. SCRUM-25/26 are existing overlapping filter issues.

Create this branch after the previous package has been integrated into main.

## Owned files

- `src/routes/auto/incidents.route.js`
- `test/incidents.test.js`
- `postman/Incidents_Lab5.postman_collection.json`
- `docs/members/incidents.md`

## Commands after extracting this ZIP outside the repository

Replace the package path below with your extraction path. Run in your clean local repository.

```powershell
git status --short
git switch main
git pull --ff-only
git switch -c feature/SCRUM-12-lab5-incidents
node 'C:\path\to\Lab5_CIRS_02_Olivia_Incidents\Apply-Package.cjs' . --check
node 'C:\path\to\Lab5_CIRS_02_Olivia_Incidents\Apply-Package.cjs' .
npm.cmd ci
npm.cmd run lint
npm.cmd test -- --coverage
git diff --check
git diff
git add -- src/routes/auto/incidents.route.js test/incidents.test.js postman/Incidents_Lab5.postman_collection.json docs/members/incidents.md
git commit -m "feat(incidents): add CIRS reporting and filters (SCRUM-12)"
```

After reviewing the commit, the member may push with
`git push -u origin feature/SCRUM-12-lab5-incidents` and open a PR using PR_DESCRIPTION.md. These are
instructions for the member; this delivery did not execute the push or create a PR.
Use your own Git identity. Never impersonate another author.

## Postman

Import `files/postman/Incidents_Lab5.postman_collection.json`. Start the fully
assembled API and run the complete collection in order. Some setup/read-back requests
use the other components. `baseUrl` is http://127.0.0.1:3000. Use fictional data only.
The complete four-component Runner passed 159 assertions in 52 requests on 6 November.
See the shared guides for the exact scope, coverage, provenance and Runner export limit.
