# Current integration status

This page describes the repository integration on 7 November 2026, separately
from the complete four-component package prepared earlier.

## Shared foundation - SCRUM-8

[PR17](https://github.com/Shyber/devops-lab-nodejs/pull/17) merged the common
package at `434c2024a782f4ab095480de703d373068467e51`: exercises 2.1-2.7,
modules, fictional fixtures, shared validation/error handling, categories,
utility routes, tests and CI. Local checks passed with 65 tests, and PR CI passed.

SCRUM-8 is the real Security Dashboard & Incident Triage epic, checked in Jira
on 7 November. The foundation supports this epic; it does not complete it.

## Yuba's analyst directory - SCRUM-11

This branch adds GET /api/analysts (active filtering), GET /api/analysts/:id and
POST /api/analysts. Creation trims names and emails, normalizes email case,
rejects duplicate emails and invalid input, and keeps the ANALYST role server-owned.
Tests check successful reads/creation, errors and unchanged data after rejected writes.

SCRUM-11, Role-Based Access Control (RBAC) & User Management, was checked in Jira
on 7 November and is assigned to Yuba. This is only its Lab5 directory subset.
Login, passwords, caller authorization and real account administration remain
outside this implementation. No Jira completion or status change is claimed.

The Analysts Postman collection runs independently after starting this API:
12 requests in order, with 36 assertions. The full four-component collection
must wait for the incident, assignment and metrics routes, which are not present.

## Existing work, authorship and validation

Codex applied and checked the packages on Yuba's explicit instruction. Git uses
Yuba's existing identity. Component ownership is not evidence of unaided authorship.

Kandarp Pandya's PR16 and feature/cirs-metrics-update branch remain separate.
Their commits are not rewritten, merged or deleted here. The shared exercise
adaptation credits PR16. Later metrics integration must reconcile its exercise
and old hospital metrics changes with the current CIRS foundation.

RESULTS.md records the earlier complete-kit measurements. The current local and
GitHub checks are recorded in the integration PRs and evidence folder. The earlier
154-test / 52-request full-project run is not a result for this partial integration.
