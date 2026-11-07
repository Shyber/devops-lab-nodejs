# Jira mapping observed on 6 November 2026

The project is displayed as CIDS and its real issue prefix is SCRUM. The mapping
below comes from the authenticated Jira browser and REST views. These are existing
issues, not invented Lab5 tickets. See `jira-snapshot.json` for titles, assignees,
observed status and links. No Jira issue, assignment or status was changed here.

| Integration component | Existing Jira work | What the link means |
| --- | --- | --- |
| Yuba - analysts | SCRUM-11, Role-Based Access Control (RBAC) & User Management; assigned to Yuba | Directory data is a Lab5 subset, not completed RBAC/account management |
| Olivia - incidents | SCRUM-12, Report an incident; SCRUM-13, View my reports and incident details; assigned to Olivia GHOUMO | Data and validation subset; authentication/ownership remain deferred |
| Olivia - filters | SCRUM-25 and SCRUM-26, View and filter all incidents | 25 assigned to Olivia but has no detailed description; 26 contains the filter contract and is unassigned; duplicate work items remain unchanged |
| Sid Ahmed - assignments | SCRUM-8, Security Dashboard & Incident Triage; unassigned epic | It defines assignment rules, but no dedicated assignment story for Sid Ahmed was found |
| Kandarp - metrics | SCRUM-14, Implement CIRS Metrics & Triage Statistics API; SCRUM-15, Automated Testing & API Validation for CIRS Metrics | Both assigned to PANDYA Kandarp Sanket; exact six-field schema, coverage and collection requirements used |

Sid Ahmed's existing SCRUM-17/18/19 cover comments, internal notes and related system
management. They must not be relabelled as the assignment task. The assignment PR
draft references the real SCRUM-8 epic and explicitly asks the team to link a dedicated
story when available. The delivery responsibility requested by Yuba is separate from
the current Jira assignee. SCRUM-16 (Yuba, history) is related context, not a claim that
the complete audit-log story is delivered by this Lab5 subset.

The first Jira search showed SCRUM-14/15 as `All tasks`. A later direct issue read
and browser view showed `En cours de revue` (In review), updated at 16:22 on 6 November.
The later issue readings are recorded. The assistant did not perform these status
changes. Other statuses retain their dated observation; check Jira before integration.
