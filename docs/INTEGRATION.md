# Integration order

For a quick local demonstration, extract `Lab5_CIRS_Projet_Assemble.zip` and follow
README.md. The five component ZIPs are for preparing real member branches and PRs.
They are not five independent servers. Only the common package owns the store,
application loader, shared validators, exercises, configuration and general guide.

1. Integrate `Lab5_CIRS_00_Commun.zip` first.
2. Integrate `Lab5_CIRS_01_Yuba_Analysts.zip`.
3. Integrate `Lab5_CIRS_02_Olivia_Incidents.zip`.
4. Integrate `Lab5_CIRS_03_Sidahmed_Assignments.zip`.
5. Integrate `Lab5_CIRS_04_Kandarp_Metrics.zip` and run the complete validation.

The shared package retires the old hospital routes/data/tests/collections and the
old metrics route/test. Kandarp's package adds the final metrics implementation and
the cross-component integration test. Do not copy the hospital files back.

Each ZIP contains `files/`, `manifest.json`, `Apply-Package.cjs`, README.md, an English
commit message and an English PR draft. Extract it into a separate staging folder,
not directly over the repository. In a clean branch, run the script with the target
repository path. The script checks every packaged file and the expected previous
contents before changing anything. It refuses unknown local changes and checks that
paths remain inside the selected repository. It does not commit or push.

```powershell
git status --short
git switch main
git pull --ff-only
git switch -c feature/lab5-cirs-common
node 'C:\path\to\Lab5_CIRS_00_Commun\Apply-Package.cjs' . --check
node 'C:\path\to\Lab5_CIRS_00_Commun\Apply-Package.cjs' .
npm.cmd ci
npm.cmd run practice
npm.cmd run modules
npm.cmd run lint
npm.cmd test -- --coverage
git diff --check
git diff
git add -A
git commit -F 'C:\path\to\Lab5_CIRS_00_Commun\COMMIT_MESSAGE.txt'
```

Review the diff before committing. The baseline is recorded in PROVENANCE.md. If
main has changed, preserve the newer work and merge the relevant files manually
instead of forcing the script. The helper uses Node.js built-in modules and works
without changing PowerShell execution policies or installing another dependency.

After the common PR is merged, each member starts from the updated main and follows
their package instructions. The sequence above keeps dependencies available. If
branches must be prepared before earlier PRs merge, use stacked branches and name
their base clearly. Do not run a full Postman collection against an incomplete API.
Run all tests/coverage and the full Runner after the final merge.

## Existing Kandarp PR16

Prefer to continue `feature/cirs-metrics-update` with Kandarp, preserving his existing
commits. After the earlier components reach main, fetch and merge the current main
into that feature branch. Resolve the js-practice.js conflict by retaining the complete
common 2.1-2.7 exercise version. For the metrics route/test, compare the prepared files
and keep the final data-derived behavior. The package script will refuse the older
PR16 content if it differs from its expected input; review and copy those exact files
manually in that case. Add the collection and integration test. Run the full checks.
Use a normal follow-up commit; no force push is needed by these instructions.

Alternatively, after team review, create `feature/SCRUM-14-lab5-metrics` from integrated
main and reference PR16 as its source. Decide with Kandarp which PR remains active.
No PR was closed, replaced or merged by this delivery.

The supplied PR text describes prepared work and measured local results. It does not
claim a new GitHub Actions run. After members push, check the new CI and link the
actual Jira keys. In particular, Sid Ahmed still needs a dedicated assignment story
if the teacher requires one issue per member rather than an epic reference.
