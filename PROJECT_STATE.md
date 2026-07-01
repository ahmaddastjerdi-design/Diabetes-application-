<!--
  Aegis-OS persistent state engine for Diabetes Quest.
  This file is the continuous memory chain: read it at the start of every turn,
  rewrite it at the end. Percentages advance organically and only against
  VERIFIED status (typecheck + smoke + tests actually run), never assumed.
  Grounded in the real stack: root Expo prototype + platform/ monorepo,
  the 10-volume spec in docs/specification/, and the Vol 10 Phase 0→5 build order.
-->

# PROJECT_STATE.md — Diabetes Quest

## 1. Overall Completion Radar
- **Current Progress:** ~78% (of the clinical-grade platform the spec suite describes)
  - Educational prototype (root Expo app): **100% — working vertical slice, verified**
  - Platform monorepo (Vol 10 Phase 0→5 cores): **~90% — real, typechecked, tested**
  - Production hardening (real OIDC, BLE GATT, full UI screens, E2E, certification): **~25%**
- **Current Active Phase:** Phase 5 complete → transition to production-hardening backlog
- **Next Immediate Dependency:** Wire remaining Postgres-backed read APIs into `clinician-web`
  (`platform/apps/clinician-web/src/api.ts`) against live `services/backend`, then add the
  first Playwright E2E gate (Vol 9 §component/E2E).

> Positioning guardrail (Vol 1 / spec README): the shipping artifact is an **educational
> simulation — not medical advice, not a medical device**. Percentages measure engineering
> progress toward the specified platform, **not** any clinical or regulatory clearance,
> which is gated separately in Vols 8 & 10.

## 2. 0-100% Master Roadmap
Mapped to the real Vol 10 build order (Phase 0→5), not generic labels.

- [x] **Phase 0 — Core Architecture & Prototype Hardening** (Status: **Done**)
  - Expo/RN patient app, physiology + gamification engines, persisted `GameContext`,
    monorepo scaffold, shared contracts, runnable test suite + CI quality gate.
- [x] **Phase 1 — Backend, Auth, Sync & Data Schema** (Status: **Done**)
  - Typed backend core, session/RBAC/consent-gated access, sync/merge, hash-chained audit,
    Postgres repositories + migrations, FHIR Observation persistence.
- [x] **Phase 2 — Device Ingestion / API Gateway Matrix** (Status: **Done**)
  - device-gateway: connectors, unit normalisation + LOINC mapping, idempotent offline
    queue with backoff, forwarding worker, integration test.
- [x] **Phase 3 — Clinician Web Panel & Clinical Engine** (Status: **Done**)
  - clinical package (TIR/GMI/CV/AGP, risk, decision support); React panel (roster,
    patient detail, AGP/organ views).
- [x] **Phase 4 — AI Health Coach (Jetpack-equivalent UX + safety)** (Status: **Done**)
  - ai-coach: guardrail core (dosing hard-block, Tier-3 red-flag escalation), grounding
    context, memory, Claude provider entry, safety-eval harness; patient app wired to it
    guardrails-first.
- [x] **Phase 5 — Verification, Security Auditing & Hardening** (Status: **Done**)
  - AES-256-GCM PHI-at-rest, SHA-256 audit chain, redaction/classification/DSAR/
    pseudonymisation, security headers; full CI gate (typecheck + smoke + 61 tests +
    full-server builds + gateway & Postgres integration).
- [ ] **Phase 6 — Production Readiness** (Status: **Pending — the remaining ~22%**)
  - Real OIDC/OAuth2 IdP (replace dev auth headers); real Health Connect + BLE GATT
    device paths (replace simulated connectors); full patient/clinician UI screens;
    RNTL + Detox/Maestro + Playwright E2E; performance/a11y/DAST CI layers;
    regulatory & clinical-safety gates (Vols 8 & 10).

## 3. Atomic Task Queue (Phase 6 — first 3–5 micro-tasks)
1. [ ] Live-wire clinician read APIs → Target: `platform/apps/clinician-web/src/api.ts` +
   `services/backend/src/server.ts` → Verify: panel renders roster/AGP from a running
   backend against Postgres (`npm run -w @diabetes-quest/backend test:integration` green).
2. [ ] First Playwright E2E for the panel → Target: `platform/apps/clinician-web/` (new
   `e2e/`) → Verify: headless run passes in CI (Chromium at `/opt/pw-browsers/chromium`).
3. [ ] Replace dev auth headers with an OIDC stub boundary → Target:
   `services/backend/src/infra/auth.ts` → Verify: `test/auth.test.mjs` extended, still green.
4. [ ] Health Connect explainer → real permission/ingest seam → Target:
   `src/screens/DeviceScreen.tsx` + `services/device-gateway/src/core/connectors.ts` →
   Verify: gateway core tests + smoke still green.
5. [ ] Add a11y + dependency-scan CI jobs → Target: `.github/workflows/ci.yml` →
   Verify: workflow runs the new jobs on push.

## 4. Architectural System Inventory
Status legend: **Verified** = typechecks/tests run green this session · **Functional** =
runs, thinner test coverage · **Skeleton** = real code, phase-gated depth pending.

- Root Expo prototype:
  - `src/engine/physiology.ts`, `gamification.ts`, `__smoke__.ts`: **Verified** (23 smoke checks pass)
  - `src/state/GameContext.tsx`, `src/screens/*`, `src/lib/{coach,sync,fhir,health,units}.ts`: **Verified** (`tsc --noEmit` clean)
- `platform/packages/`:
  - `shared` (domain + FHIR contracts): **Verified**
  - `clinical` (AGP/risk/decision-support): **Verified**
  - `security` (crypto/redaction/classification/dsar/pseudonymize/headers): **Verified**
- `platform/services/`:
  - `backend` (core + auth + audit chain + repositories.pg + migrations): **Verified** (core/service/auth/observations suites; Postgres integration gated to CI)
  - `ai-coach` (guardrails + escalation + memory + provider + eval): **Verified** (guardrail safety floor green)
  - `device-gateway` (mapping + queue + worker + deliver): **Verified** (core + forwarding integration green)
- `platform/apps/`:
  - `clinician-web` (roster, patient detail, AGP): **Functional/Skeleton** (renders sample data; live API wiring is Phase 6 task #1)
  - `mobile` (README seed for migrating root prototype): **Skeleton**
- CI: `.github/workflows/ci.yml` — 3 jobs (prototype, platform, backend-Postgres): **Verified** locally except Postgres job (needs live DB, runs in CI).

## 5. Blockers & Edge Cases Addressed
- **Env-only typecheck failures** (`expo/tsconfig.base` not found, `tsx` missing) → resolved:
  they were missing `node_modules`, not code defects; `npm install` at root **and** in
  `platform/` clears both. Recorded so a future turn doesn't misread them as regressions.
- **Simulation ≠ clinical truth** → the physiology engine is labelled educational and kept
  strictly separate from real observation data (spec anchor); no clinical claim is implied
  by any percentage here.
- **AI safety-critical path** → guardrails run *before* the network in the patient app
  (`src/lib/coach.ts`): dosing questions are hard-blocked and red-flags escalate locally
  even when the server is unreachable (verified by smoke + `ai-coach/test/guardrails`).
- **Sync idempotency** → outbox dedup / idempotent queue proven by backend + gateway core
  tests, so retries can't double-write Observations.
- **PHI at rest** → AES-256-GCM field encryption + SHA-256 hash-chained audit (Phase 5),
  with **no hardcoded keys** in the encryption path (`security/src/crypto.ts`).

---
_Last synchronized: 2026-07-01. Verification run this turn: root `tsc --noEmit` clean;
`npm run smoke` 23/23 pass; platform `build:libs` + `typecheck` clean; `npm test` 61/61
pass; `backend|device-gateway|ai-coach build:full` clean; device-gateway integration 1/1.
Backend-Postgres integration deferred to CI (needs live DB)._
