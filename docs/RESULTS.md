# Measured results for the prepared complete kit

These are historical complete-kit measurements. See INTEGRATION_STATUS.md for the
current repository stage and the integration PR for its own checks.

Prepared on 6 November 2026; packaging resumed on 7 November after a PC restart.

| Check | Observed result |
| --- | --- |
| npm ci | Passed with the preserved lockfile; existing dependency deprecation notices were reported |
| npm run practice | Passed; all JavaScript exercise outputs, including caught error and awaited result |
| npm run modules | Passed; module arrays/functions imported and executed |
| npm run lint | Passed, exit code 0 after StandardJS formatting corrections |
| Vitest/Supertest | 154 passed tests in 15 passed files |
| Statements | 97.08%, 200/206 |
| Branches | 97.70%, 85/87 |
| Functions | 96.55%, 56/58 |
| Lines | 96.55%, 168/174 |
| Business route files | 100% on all four coverage metrics |
| Postman desktop full Runner | 52 requests, 159 passed assertions, 0 failed/skipped/runtime errors |

Coverage includes src/index.js. Its process-listener entry point has zero unit-test
coverage and is not hidden with an exclusion. It was exercised by starting the actual
local server and making the Postman/browser requests, outside instrumented Vitest.
Thresholds are 80% for each aggregate metric, matching or exceeding the Lab5/CI gate.

At the time of the complete-kit preparation, its changes had not been pushed,
so no new remote CI result was claimed for that kit. The original PR16 had a passing check for its existing head. The package
assembly verification and final archive hashes are delivered separately in
ASSEMBLY_VERIFICATION.json and ZIP_SHA256SUMS.txt at the delivery root.

Remaining integration work: members review and commit/push their own packages, run
their new GitHub CI, link the real Jira tasks and obtain a dedicated assignment issue
if required. Lab6, authentication and persistence remain outside this delivery.
Postman's native Runner JSON export requires a paid plan; actual screenshots,
request/assertion index and a labelled transcription are supplied instead.
