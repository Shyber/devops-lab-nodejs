# Sources and real authorship

Starting repository: https://github.com/Shyber/devops-lab-nodejs

Starting main commit: `ed6565f0371e2fdd3d21ec9b47e9f0941731f29f`. Preparation used the separate local worktree
branch `prepare/lab5-cirs-20261106`. The original main worktree was preserved.

Existing PR: https://github.com/Shyber/devops-lab-nodejs/pull/16

PR16 was open when inspected on 6 November 2026. Its branch is
`feature/cirs-metrics-update`, head `680e37ccf3d630e6783b503f5cc7e7d4ca99effe`. Its author is
KANDARP-SANKET-PANDYA and its commits identify Kandarp Pandya. The initial CIRS
adaptation in js-practice.js, metrics.route.js and metrics.test.js is credited to him.
This preparation completes omitted exercise steps and replaces fixed metric counts
with data-derived values. The existing PR's passing CI applies to its own head,
not to this unpushed preparation.

The remaining adaptation, additional tests, collections, documentation, captures
and packaging were prepared by Codex for Yuba on 6-7 November 2026. The member names
identify integration responsibilities requested by Yuba. They do not assert that
Olivia, Sid Ahmed or Kandarp wrote the newly prepared files or ran these checks.
No new member commit, push, PR, review, merge, Jira update or team meeting was fabricated.
Members should inspect, understand and adapt their component before committing with
their own normal Git identity. Do not use `--author` to impersonate someone else.

Requirements were read from `SED_Lab_5 (2).pdf` and the local CIRS BRD, SRS and SDD
documents. `source-manifest.json` records their SHA-256 values. The Desktop
`Lab6_CIRS_Kit_Complet.zip` was inspected as a preparation source. Its useful CIRS
validation/assignment patterns were considered; its SQL/JWT/password implementation
was not activated. Lab5 code uses the existing repository's auto-mounted Express
route architecture. The dependency lockfile was retained.

All screenshots are real screen pixels from VS Code, its terminal, Postman and
Chrome. Win32 BitBlt captured the screen without drawing the mouse pointer. No
results or UI elements were composited or redrawn. Captures are dated 6 November;
packaging resumed on 7 November after the user's Wi-Fi failure and PC restart.
