# Yuba - Analysts integration package

Responsibility: analysts. Prepared and integrated by Codex on Yuba's explicit
instruction, using Yuba's existing Git identity. This does not claim unaided student
authorship. The commands below document the package workflow.

Jira: SCRUM-11. Integration branch: `feature/SCRUM-11-lab5-analysts`.

Add GET list/detail and POST analyst directory routes. Validate names, email uniqueness and active flags. Keep the ANALYST role server-owned. This is the Lab5 directory subset of SCRUM-11; login and full RBAC remain later work.

Create this branch after the previous package has been integrated into main.

## Owned files

- `src/routes/auto/analysts.route.js`
- `test/analysts.test.js`
- `postman/Analysts_Lab5.postman_collection.json`
- `docs/members/analysts.md`

## Commands after extracting this ZIP outside the repository

Replace the package path below with your extraction path. Run in your clean local repository.

```powershell
git status --short
git switch main
git pull --ff-only
git switch -c feature/SCRUM-11-lab5-analysts
node 'C:\path\to\Lab5_CIRS_01_Yuba_Analysts\Apply-Package.cjs' . --check
node 'C:\path\to\Lab5_CIRS_01_Yuba_Analysts\Apply-Package.cjs' .
npm.cmd ci
npm.cmd run lint
npm.cmd test -- --coverage
git diff --check
git diff
git add -- src/routes/auto/analysts.route.js test/analysts.test.js postman/Analysts_Lab5.postman_collection.json docs/members/analysts.md
git commit -m "feat(analysts): add validated CIRS analyst directory (SCRUM-11)"
```

The authorized integration uses
`git push -u origin feature/SCRUM-11-lab5-analysts` and a PR linked to SCRUM-11.
See the PR and integration evidence for the actual publication and CI results.
Use your own Git identity. Never impersonate another author.

## Postman

Import `postman/Analysts_Lab5.postman_collection.json` from this repository.
Start the API with `npm start`, then run all 12 requests in order (36 assertions).
This collection only needs the common foundation and Analysts. It creates its own
fictional analyst and checks successful reads, validation errors and duplicate email.
The default `baseUrl` is http://127.0.0.1:3000. No secret or real account is used.
