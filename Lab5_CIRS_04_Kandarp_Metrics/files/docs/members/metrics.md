# Kandarp - Metrics integration package

Responsibility: metrics. Prepared by Codex for Yuba; this is not a record
of a commit or execution by Kandarp. Review and understand the files before integrating.

Jira: SCRUM-14 and SCRUM-15; existing PR16. Proposed branch: `feature/SCRUM-14-lab5-metrics`.

Extend Kandarp Pandya's PR16 adaptation. Keep the exact six Jira metric fields and calculate counts from current incidents and fictional analyst presence. Verify that creating a report changes the active count and reject direct metric writes. Add the required Metrics_Lab5 Postman collection and the final cross-component integration test.

For PR16, use the existing-branch procedure in docs/INTEGRATION.md; the branch below is the alternative new-PR proposal.

## Owned files

- `src/routes/auto/metrics.route.js`
- `test/metrics.test.js`
- `postman/Metrics_Lab5.postman_collection.json`
- `docs/members/metrics.md`
- `test/cirs-integration.test.js`

## Commands after extracting this ZIP outside the repository

Replace the package path below with your extraction path. Run in your clean local repository.

```powershell
git status --short
git switch main
git pull --ff-only
git switch -c feature/SCRUM-14-lab5-metrics
node 'C:\path\to\Lab5_CIRS_04_Kandarp_Metrics\Apply-Package.cjs' . --check
node 'C:\path\to\Lab5_CIRS_04_Kandarp_Metrics\Apply-Package.cjs' .
npm.cmd ci
npm.cmd run lint
npm.cmd test -- --coverage
git diff --check
git diff
git add -- src/routes/auto/metrics.route.js test/metrics.test.js postman/Metrics_Lab5.postman_collection.json docs/members/metrics.md test/cirs-integration.test.js
git commit -m "feat(metrics): derive CIRS counts from shared data (SCRUM-14 SCRUM-15)"
```

After reviewing the commit, the member may push with
`git push -u origin feature/SCRUM-14-lab5-metrics` and open a PR using PR_DESCRIPTION.md. These are
instructions for the member; this delivery did not execute the push or create a PR.
Use your own Git identity. Never impersonate another author.

## Postman

Import `files/postman/Metrics_Lab5.postman_collection.json`. Start the fully
assembled API and run the complete collection in order. Some setup/read-back requests
use the other components. `baseUrl` is http://127.0.0.1:3000. Use fictional data only.
The complete four-component Runner passed 159 assertions in 52 requests on 6 November.
See the shared guides for the exact scope, coverage, provenance and Runner export limit.
