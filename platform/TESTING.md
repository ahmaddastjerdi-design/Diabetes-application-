# Testing — Platform

Phase 0 test suite (Vol 9). Dependency-free: Node's built-in test runner (`node --test`)
over the compiled packages — no Jest/registry needed to run locally, and the same
command runs in CI (`.github/workflows/ci.yml`).

```bash
cd platform
npm install        # CI: provides tsc + workspace links
npm test           # build:libs, then run all suites
# or per package:
npm test -w @diabetes-quest/ai-coach
```

> In this repo's sandbox (no registry) the suite was verified with a manual
> `npx typescript` build + `node --test`: **19/19 passing**.

## Requirements traceability (test → spec)

| Suite | Asserts | Requirements |
|-------|---------|--------------|
| `packages/shared/test/domain.test.mjs` | unit conversion round-trips; marker bands ⊂ clamps; organ→marker integrity | Vol 7 i18n (mg/dL↔mmol/L), Vol 1 model |
| `services/backend/test/core.test.mjs` | forgiving streak; streak restarts at 1 not 0; XP/level curve; Observation validation; idempotency/dedup | `FR-BE-*`, Vol 4 §gamification/§sync |
| `services/ai-coach/test/guardrails.test.mjs` | Tier-3 red-flag detection; dosing hard-block; guardrails override the model | `FR-AI-*`, Vol 6 §guardrails (safety-critical) |
| `services/device-gateway/test/core.test.mjs` | units normalisation + LOINC mapping; stable identifiers; idempotent queue + backoff | `FR-DEV-*`, Vol 5 §mapping/§queue |

The AI-coach guardrail suite is the **safety floor** — it must stay green; Vol 6's full
safety-eval suite (red-team transcripts, ≥99% Tier-3 recall on a labelled set) extends it
in Phase 4.

## Not yet covered (built with their phase, per Vol 10)

- Integration tests against Postgres (backend, Phase 1) and the real Claude provider (Phase 4).
- Component/E2E: RNTL + Detox/Maestro (mobile), Playwright (clinician-web) — Phases 2–3.
- Performance, accessibility, and DAST/dependency scans — wired into CI as those layers land.
