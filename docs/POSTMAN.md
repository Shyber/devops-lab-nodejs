# Postman guide and observed result

Start the assembled API with `npm start`. Import the five `.postman_collection.json`
files in `postman/` and optionally `CIRS_Local.postman_environment.json`. `baseUrl`
defaults to `http://127.0.0.1:3000` at collection level, so no environment is required.

Open **CIRS Lab5 - Full validation**, click **Run**, keep all 52 requests selected,
use one local functional iteration, then start the run. Execute requests in order.
The first request of the analyst and assignment groups generates a unique email
suffix. Later requests use IDs and counts saved by earlier requests. For individual
screenshots, execute the setup requests first. Re-running a POST without its setup
can correctly produce a duplicate error and invalidate the following test variables.

| Group | Requests | Assertions in the complete run |
| --- | ---: | ---: |
| Common | 5 | 15 |
| Analysts | 12 | 36 |
| Incidents | 13 | 39 |
| Assignments | 15 | 42 |
| Metrics | 7 | 27 |
| Total | 52 | 159 |

Observed in the real Postman desktop Runner on 6 November 2026 at 16:41 Europe/Paris:
159 passed, 0 failed, 0 skipped and 0 runtime errors; one iteration, duration 5.748 s.
The assertions check status, JSON/error shape, saved values, server defaults,
data-derived metrics and unchanged counts after rejected writes or assignments.

The full collection was exported from the application in Collection Format v2.1.
The four member collections were split from its exported folders. Their HTTP
requests, bodies and scripts were compared with the executed source and matched.
Only component metadata and the baseUrl variable are independent in member files.
Run member collections against the assembled project, since setup and read-back
requests can use another member's endpoint.

Postman displayed a paid-plan requirement for native Runner JSON export. No trial
or purchase was started. The delivery instead contains actual Runner screenshots,
a complete request/assertion index and a clearly labelled transcribed run summary.
These documents are not presented as a native Postman run JSON export.

Individual demonstration requests were also sent after the full run. One assignment
attempt skipped the first setup request and correctly failed; it was repeated in
the documented order and passed. Only the successful prepared captures and intended
error cases are included. The complete Runner result above is the original full run.

Metrics are read-only. Their collection sends a valid incident POST, verifies that
the computed count increases, then verifies that POST `/api/metrics` is rejected
with 405 and does not overwrite the computed data. Use the Runner for the whole
sequence; a single metric request can depend on a count captured earlier.
