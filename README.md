# DevOps Lab – Student Project (Node.js + Jira/GitHub + CI/CD)

This repository is a **teaching template** for a 4-student DevOps mini-project.

It demonstrates the workflow: **PLAN (Jira) → CODE (Git/VS Code) → BUILD/TEST (GitHub Actions) → REVIEW (PRs) → DEPLOY (optional)**.

> **What you get here**
> - Minimal **Express** API with auto-mounted routes
> - **Vitest + Supertest** for integration and unit tests
> - Coverage thresholds enforced by Vitest during CI
> - **GitHub Actions** workflow for lint, tests and a coverage artifact
> - Clear file layout for a team of 4

---

## Quickstart

Use **Node.js 20.19.0 or newer**.

```bash
npm ci
npm run dev          # http://localhost:3000
npm test -- --coverage
```

On Windows PowerShell, use `npm.cmd` instead of `npm` if script execution is blocked (for example, `npm.cmd ci`).

Open `coverage/index.html` to view the coverage report locally.

---

## Routes

- `GET /` – basic JSON greeting
- `GET /health` – health check (200 OK)
- `GET /version` – returns `{ version }` from `package.json`
- `GET /info` – returns `{ name, version, node, uptime }`
- `GET /boom` – triggers an error to test the global error handler

Routes are **auto-mounted** from `src/routes/auto/*.route.js`, so each student can work on a route without editing `src/app.js` (fewer merge conflicts).

---

## Tests

- **Integration tests** (Supertest) check HTTP endpoints in `test/*.test.js`.
- **Unit tests** check internal logic in `test/unit/*.test.js`.

Coverage thresholds are configured in **`vitest.config.js`**, not in `package.json`:

| Metric | Minimum |
|---|---:|
| Lines | 80% |
| Functions | 80% |
| Statements | 80% |
| Branches | 70% |

If coverage is below a threshold, the **CI check fails**. The team should check that CI passes before merging a Pull Request.

---

## Branch & Commit Convention (Jira-friendly)

- Branch: `feature/<ISSUE-KEY>-<short-desc>` → e.g., `feature/DEVOPS-6-info-endpoint`
- Commit: `feat(<ISSUE-KEY>): <what>` or `test(<ISSUE-KEY>): <what>` → e.g., `test(DEVOPS-8): add uptime boundary cases`
- PR title: `<ISSUE-KEY> | <title>` → e.g., `DEVOPS-8 | Add uptime boundary tests`

When **GitHub for Jira** is connected, including the Jira key in branches, commits and PRs helps link the work to Jira.

---

## CI (GitHub Actions)

The workflow in `.github/workflows/ci.yml` runs on pushes to `main` and Pull Requests targeting `main`:

1. Check out the repository and set up Node.js
2. Install dependencies with `npm ci`
3. Run `npm run lint`
4. Run `npm test -- --coverage`
5. Upload the `coverage/` folder as the **`coverage-report`** artifact

A successful CI run means these automated checks passed. Code review and merging are separate steps.

---

## Project layout

```text
src/
  app.js          # Express app (auto-mount + global error handler)
  index.js        # Server entry point (not used by tests)
  routes/auto/    # Auto-mounted *.route.js files
  utils/          # Small testable helpers
test/
  *.test.js       # Integration (HTTP) tests
  unit/*.test.js  # Unit tests
vitest.config.js  # Coverage configuration and minimum thresholds
```

---

## Useful scripts

- `npm run dev` – start the development server with **Node.js built-in watch mode** (`node --watch`)
- `npm start` – start the server without watch mode
- `npm test` – run all tests with Vitest
- `npm test -- --coverage` – run tests with coverage
- `npm run lint` – check JavaScript style with ESLint
- `npm audit` – check dependencies for known vulnerabilities

Enjoy the lab!