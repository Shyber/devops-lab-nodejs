# Lab5 CIRS: metrics

Extend Kandarp Pandya's PR16 adaptation. Keep the exact six Jira metric fields and calculate counts from current incidents and fictional analyst presence. Verify that creating a report changes the active count and reject direct metric writes. Add the required Metrics_Lab5 Postman collection and the final cross-component integration test.

Related Jira: SCRUM-14 and SCRUM-15; existing PR16. This PR covers the Lab5 subset documented in docs/SCOPE.md.
Dependencies: common package and preceding components in docs/INTEGRATION.md.

Validation of the assembled preparation: JavaScript exercises/modules and lint pass;
154 Vitest/Supertest tests pass; coverage is 97.08% statements, 97.70% branches,
96.55% functions and 96.55% lines. The Postman desktop full Runner passed all 159
assertions in 52 requests. Re-run the checks on this branch and attach its actual CI.

Prepared by Codex for Yuba. Member integration responsibility: Kandarp.
Existing Kandarp Pandya PR16 contributions are credited in docs/PROVENANCE.md.
This draft does not claim a commit, review or execution by another team member.
