# Diabetes Quest — Volume 10: Claude Code Master Build Playbook

_Part of the Diabetes Quest Specification Suite — Volume 10 of 10._

**Abstract.** This is the capstone, operational volume of the Diabetes Quest specification suite. Volumes 1–9 describe *what* to build — the product vision, the Android patient app, the clinician panel, the backend and FHIR layer, medical-device integration, the AI Health Coach, the UI/UX design system, the security/compliance posture, and the QA strategy. This volume describes *how to build it*, in what order, and under what engineering discipline — specifically when the primary implementer is an AI coding agent (Claude Code) working alongside human engineers. It defines the engineering principles, the phased dependency-ordered backlog (Phase 0 → Phase 5), the Definition of Ready and Definition of Done, the working agreement and guardrails for the AI agent, coding standards anchored to the *actual* repository (`tsconfig.json`, the `typecheck` and `smoke` scripts, the `src/` layout), the Git/PR/CI workflow, documentation and ADR discipline, a reusable per-task prompt template with a fully worked example, a traceable backlog table, build/operations requirements with stable `BUILD-NNN` IDs, and a DevOps/CI-CD outline (environments, pipelines, release, rollback). It is the single document an engineer or an AI agent should open before writing a line of code.

> **Educational-only today; clinical-safety is non-negotiable.** The repository is currently an Expo / React Native 0.85 / React 19 / TypeScript vertical-slice prototype with a deliberately simplified, directionally-faithful physiology engine. It is **not** a medical device. The clinical-grade target described across the suite is a *roadmap*, gated behind clinician review, validation, and the compliance work in Volume 8. Every instruction in this playbook is subordinate to one rule: **never invent, alter, or hard-code a clinical value, threshold, dosing rule, or safety message without a cited, clinician-approved source.**

---

## Table of contents

1. [Purpose & how to use this playbook](#1-purpose--how-to-use-this-playbook)
2. [Engineering principles](#2-engineering-principles)
3. [The repository today — the ground truth](#3-the-repository-today--the-ground-truth)
4. [Phased build order (Phase 0 → Phase 5)](#4-phased-build-order-phase-0--phase-5)
5. [Definition of Ready & Definition of Done](#5-definition-of-ready--definition-of-done)
6. [Working agreement for the AI agent](#6-working-agreement-for-the-ai-agent)
7. [Guardrails & STOP-and-verify checkpoints](#7-guardrails--stop-and-verify-checkpoints)
8. [Coding standards & conventions](#8-coding-standards--conventions)
9. [Git & workflow discipline](#9-git--workflow-discipline)
10. [DevOps / CI-CD outline](#10-devops--ci-cd-outline)
11. [Documentation discipline & ADRs](#11-documentation-discipline--adrs)
12. [Per-task prompt template](#12-per-task-prompt-template)
13. [Worked example — Phase 0 task](#13-worked-example--phase-0-task)
14. [Master backlog table](#14-master-backlog-table)
15. [Build & operations requirements (BUILD-NNN)](#15-build--operations-requirements-build-nnn)
16. [Traceability & cross-references](#16-traceability--cross-references)

---

## 1. Purpose & how to use this playbook

### 1.1 What this volume is

This is the **build playbook and DevOps specification**. It converts the nine descriptive volumes into an executable, dependency-ordered program of work, and it codifies the discipline under which that work is performed by an AI coding agent and human engineers together. Where Volumes 1–9 answer *what* and *why*, this volume answers *how*, *in what order*, and *under what guardrails*.

### 1.2 Who reads it, and when

| Reader | When they open this volume | What they take from it |
|--------|----------------------------|------------------------|
| AI coding agent (Claude Code) | Before starting **any** task | §6 working agreement, §7 guardrails, §8 standards, §12 prompt template |
| Human engineer | Onboarding; before opening a PR | §5 DoR/DoD, §9 Git workflow, §10 CI-CD |
| Tech lead / reviewer | Planning a milestone; reviewing a PR | §4 phases, §14 backlog, §5 DoD as a review gate |
| Product / compliance | Sequencing and audit | §4 phase dependencies, §15 requirements, §11 ADRs |

### 1.3 How to use it with Claude Code

1. **Pick exactly one task** from the §14 backlog (or a sub-task of it). Never start an undefined "make it better" task.
2. **Fill the §12 prompt template** with that task's context, its source volume, and its acceptance criteria.
3. The agent **plans first** (§6.1), surfaces the plan, and proceeds only when the plan is sound and the task meets the **Definition of Ready** (§5.1).
4. The agent works in **small reviewable increments**, writing or updating tests, running `npm run typecheck` and `npm run smoke` (and the test suite once it exists) before every commit.
5. The agent **self-reviews against the Definition of Done** (§5.2) and the guardrails (§7) before declaring the task complete.
6. A human (or a second review pass) approves the PR against the §9.4 checklist and the §10 CI gates.

### 1.4 The golden rules (read these first)

- **G1 — Architecture before code.** Know which module owns the change and which boundary it crosses before writing it (§2.1, §8.3).
- **G2 — Verify, never assume, an API.** Do not call a library, hook, or endpoint you have not confirmed exists at the version pinned in `package.json` (§7.1).
- **G3 — Never invent clinical values.** Thresholds, bands, dosing, and safety copy come from a cited, clinician-approved source — never from the model's memory (§7.2).
- **G4 — No PHI in logs, errors, analytics, or commit messages** (§8.6).
- **G5 — Tests and docs ship with the code, not "later"** (§5.2).
- **G6 — Stay in scope; a discovered second problem becomes a backlog item, not a silent expansion of the current PR** (§7.3).

---

## 2. Engineering principles

These principles are binding constraints, not aspirations. Each maps to a guardrail in §7 and a DoD item in §5.2.

### 2.1 Architecture-first

Before any code is written, the agent identifies: (a) the module that *owns* the behaviour, (b) the boundaries it crosses, (c) the contracts (types/interfaces) at those boundaries, and (d) whether an **ADR** (§11) is warranted. The existing prototype already exhibits clean boundaries — `engine/` (pure logic), `data/` (catalogs), `state/` (single source of truth via context), `components/` and `screens/` (presentation). New work *extends* this layering; it does not erode it. Pure domain logic stays free of React, storage, and I/O so it remains unit-testable in isolation (as `engine/physiology.ts` is today).

### 2.2 Test-driven where it pays

Strict TDD is required for **pure logic with defined inputs/outputs** (the physiology and gamification engines, validators, sync reconciliation, FHIR mappers, AI safety filters). For UI and integration work, tests are written alongside the implementation, not skipped. The bar: *every behaviour that a clinician, auditor, or future refactor would care about has an automated test that fails before the fix and passes after.*

### 2.3 Small, reviewable increments

A task produces a PR a human can review in one sitting (target < ~400 changed lines excluding generated code and fixtures). Large epics are decomposed into milestones, milestones into tasks, before work begins. If a task balloons mid-flight, **stop and re-plan** rather than producing an un-reviewable PR.

### 2.4 No hallucinated or unverified APIs

Every external symbol (library function, Expo module, React Native API, backend endpoint, FHIR resource field) is verified against the pinned version or the owning spec *before* use. "I believe this exists" is not sufficient. See the STOP-and-verify checkpoint in §7.1.

### 2.5 Clinical-safety at every step

Any change that touches a marker band, organ-impact weight, dosing, alert threshold, lesson content, or user-facing health copy triggers the clinical-safety checkpoint (§7.2). The educational-only disclaimer must remain visible wherever simulated physiology is shown (Volume 1, Volume 8).

### 2.6 Never invent clinical values

The physiology engine's bands and weights (e.g. glucose 80–140 mg/dL, the heart/kidney sensitivity weights in `physiology.ts`) are *teaching constants* documented in `DESIGN.md`, not clinical truth. They may only change with a cited rationale and clinician sign-off recorded in an ADR. New clinical values (real reference ranges, alert thresholds, the AI coach's safety rules) must originate from Volume 5 / Volume 6 / Volume 8 and a cited clinical source — never from the agent's training data.

### 2.7 Leave the campsite cleaner

No new technical debt without an explicit, logged decision. If a shortcut is unavoidable, it is captured as a `// TODO(BUILD-xxx):` referencing a real backlog item plus an ADR if it affects architecture. Silent debt is a DoD failure.

---

## 3. The repository today — the ground truth

Instructions in this playbook are grounded in the **actual** repository, not a generic stack. Do not assume tooling that is not present; add it deliberately via a Phase 0 task.

### 3.1 Stack (from `package.json`)

- **Runtime/UI:** Expo `~56.0.12`, React Native `0.85.3`, React `19.2.3`.
- **Navigation:** React Navigation 7 (`native`, `native-stack`, `bottom-tabs`).
- **Persistence:** `@react-native-async-storage/async-storage` `^3.1.1` (device-local, unencrypted today).
- **Language/build:** TypeScript `~6.0.3`, `tsconfig.json` extends `expo/tsconfig.base` with `"strict": true`.

### 3.2 Scripts that exist today (from `package.json`)

| Script | Command | Role |
|--------|---------|------|
| `npm run typecheck` | `tsc --noEmit` | The current type gate. Must stay green on every commit. |
| `npm run smoke` | `tsx src/engine/__smoke__.ts` | Runtime sanity checks for the physiology engine. The seed for the Phase 0 Jest suite. |
| `npm run android` / `start` / `web` / `ios` | `expo start …` | Local run. |

There is **no Jest, no ESLint/Prettier config, no CI workflow, and no encrypted storage yet.** Establishing these is the explicit work of Phase 0 (§4.1). Until they exist, `typecheck` + `smoke` are the *only* automated gates and must never be allowed to break.

### 3.3 Source layout (from `src/`)

```
App.tsx                     Navigation root (bottom tabs) + providers
index.ts                    Expo entry
src/
  engine/
    physiology.ts           Pure organ-impact simulation (markers → organs)
    gamification.ts         Pure XP / levels / badges / forgiving streak (SDT)
    __smoke__.ts            Runtime sanity checks (Phase 0 → Jest)
  data/
    actions.ts              Catalog of loggable diet/exercise/drug actions
    lessons.ts              Education quests + quizzes
  state/
    GameContext.tsx         Single source of truth, persisted via AsyncStorage
  components/               OrganCard, MarkerRow, ui primitives
  screens/                  Home, Log, Learn, Profile
  theme.ts                  Design tokens
```

**Architectural facts to preserve:** `engine/` is pure and I/O-free; `data/` is static content; `state/` is the only place persistence happens; presentation never reaches into storage directly. New layers introduced in later phases (an API client, a device adapter, a sync engine) must respect this separation — domain logic stays pure and testable.

---

## 4. Phased build order (Phase 0 → Phase 5)

The program is sequenced by **dependency**, not by feature appeal. Each phase lists its goal, key deliverables, dependencies, and the volumes it draws from. A phase is "done" only when its exit criteria hold; a later phase must not start work that depends on an unfinished earlier deliverable. Phases may overlap *only* where a task has no cross-phase dependency.

### 4.1 Phase 0 — Harden the prototype (foundation)

- **Goal:** Make the existing prototype safe to build on: real tests, CI, linting, encrypted local storage, and the disclaimer/consent surfaces — without changing product behaviour.
- **Key deliverables:**
  - Jest + `ts-jest` (or babel-jest) configured; the `__smoke__.ts` assertions promoted to a real test suite (`engine/physiology.test.ts`, `engine/gamification.test.ts`). `npm test` added.
  - ESLint + Prettier with a TypeScript-strict ruleset; `npm run lint` and `npm run format:check`.
  - GitHub Actions CI running `typecheck`, `lint`, `test`, `smoke` on every PR (Volume 9).
  - Encrypted at-rest storage abstraction replacing raw AsyncStorage for any data that *will* become PHI (Volume 8) — introduced behind the existing `state/` boundary.
  - Educational-only disclaimer + consent/onboarding surfaces verified present (Volume 1, Volume 8).
  - Repo hygiene: `CONTRIBUTING.md`, ADR directory, PR template, CODEOWNERS.
- **Dependencies:** none (this is the base of the dependency graph).
- **Draws from:** Volume 9 (QA/CI), Volume 8 (storage/consent), Volume 1 (disclaimer), Volume 7 (lint/design-token conventions).
- **Exit criteria:** CI green on a clean PR; ≥ 1 unit test per engine; no raw AsyncStorage write of future-PHI; coverage gate (e.g. ≥ 80% on `engine/`) enforced.

### 4.2 Phase 1 — Backend, auth & sync

- **Goal:** Stand up the backend, authenticated identity, and device⇄cloud sync so state is no longer device-only.
- **Key deliverables:** API service and schema (Volume 4); authn/authz (OAuth2/OIDC, role model patient/clinician/admin); a typed API client in the app behind the `state/` boundary; offline-first sync/reconciliation for logged actions and progress; audit logging (no PHI in logs); FHIR resource scaffolding for the data that will be exchanged.
- **Dependencies:** Phase 0 (CI, encrypted storage, test harness).
- **Draws from:** Volume 4 (backend/FHIR), Volume 8 (auth, encryption-in-transit, audit), Volume 2 (app data model).
- **Exit criteria:** authenticated round-trip sync with conflict handling tested; no PHI in any log; integration tests green in CI.

### 4.3 Phase 2 — Device integration (Health Connect first)

- **Goal:** Replace self-report with real signals, starting with Android Health Connect for steps/activity, then BLE devices (CGM/BGM/BP/scale) per Volume 5.
- **Key deliverables:** a `health/` device-adapter layer (pure interface + Android Health Connect implementation); permission/consent flows; ingestion that feeds the existing physiology inputs without breaking the pure engine; BLE adapters phased behind the same interface.
- **Dependencies:** Phase 1 (sync + identity to attribute readings); Phase 0 (consent, tests).
- **Draws from:** Volume 5 (medical devices, Health Connect, BLE), Volume 8 (consent, data minimisation), Volume 2.
- **Exit criteria:** Health Connect steps auto-log into the simulation behind a feature flag; adapter interface covered by tests with a fake device; graceful permission-denied paths.

### 4.4 Phase 3 — Clinician web panel

- **Goal:** Deliver the clinician-facing web panel (review, content approval, patient cohort views) per Volume 3.
- **Key deliverables:** web client; clinician auth/roles; read views over patient/cohort data via the Volume 4 API; the **clinician content-review workflow** (the gate that makes lessons/effect-magnitudes safe per `DESIGN.md` §4 roadmap and Volume 1).
- **Dependencies:** Phase 1 (API, auth, roles).
- **Draws from:** Volume 3 (doctor panel), Volume 4 (API/FHIR), Volume 7 (design system on web), Volume 8 (RBAC, audit).
- **Exit criteria:** clinician can review and approve content; access is RBAC-gated and audited; e2e tests for the review workflow.

### 4.5 Phase 4 — AI Health Coach

- **Goal:** Add the safety-bounded AI coach (Volume 6) that explains and motivates, **never** diagnoses or doses.
- **Key deliverables:** coaching service with a hard **safety filter** layer; grounding in app data + clinician-approved content only; red-team test suite for unsafe outputs; human-in-the-loop and escalation paths; full disclaimer framing.
- **Dependencies:** Phase 1 (data), Phase 3 (clinician oversight), Phase 0 (test harness).
- **Draws from:** Volume 6 (AI system, safety filters), Volume 8 (privacy, PHI handling, no PHI to third parties without DPA), Volume 1 (educational-only framing).
- **Exit criteria:** safety filter blocks the red-team corpus; no unverified clinical claims; every coach surface carries the disclaimer; outputs are logged for audit without PHI leakage.

### 4.6 Phase 5 — Compliance & regulatory hardening

- **Goal:** Bring the platform to the HIPAA/GDPR/OWASP posture and regulatory readiness described in Volume 8.
- **Key deliverables:** completed threat model and pen-test remediation; DPIA/records of processing; data-subject rights (export/delete); BAAs/DPAs; SBOM and dependency-supply-chain controls; full audit trail; release/validation evidence package.
- **Dependencies:** all prior phases (you cannot harden what is not built).
- **Draws from:** Volume 8 (security/compliance), Volume 9 (validation/QA evidence), Volume 4/5/6 (data flows).
- **Exit criteria:** OWASP ASVS targets met; pen-test high/criticals closed; GDPR rights demonstrable; compliance evidence package complete.

### 4.7 Phase dependency graph

```
Phase 0 (harden) ──┬─→ Phase 1 (backend/auth/sync) ──┬─→ Phase 2 (devices)
                   │                                  ├─→ Phase 3 (clinician panel) ─→ Phase 4 (AI coach)
                   │                                  └──────────────────────────────┘
                   └──────────────────────────────────────────────────────────────→ Phase 5 (compliance, spans all)
```

---

## 5. Definition of Ready & Definition of Done

### 5.1 Definition of Ready (DoR) — a task may start only if:

1. It maps to a single backlog item (§14) with a stable ID and an identified **source volume**.
2. **Acceptance criteria** are explicit and testable.
3. The owning module/boundary is identified (§2.1); cross-cutting changes have an ADR stub.
4. All inputs exist: any clinical value, copy, or contract it depends on is *already cited/approved* (never to be invented mid-task — §2.6).
5. Dependencies from earlier phases are satisfied.
6. The scope fits one reviewable increment (§2.3); otherwise it is split first.

### 5.2 Definition of Done (DoD) — a task is complete only if **all** hold:

1. **Behaviour matches acceptance criteria** and the relevant spec volume.
2. **Tests:** new/changed pure logic has unit tests; integration/UI behaviour has appropriate tests; tests fail before and pass after. Coverage gate respected.
3. **Gates green:** `npm run typecheck`, `npm run lint`, `npm test`, `npm run smoke` all pass locally and in CI.
4. **Architecture intact:** no boundary erosion; domain logic stays pure; no new circular deps.
5. **Security:** no PHI in logs/errors/analytics/commits; secrets externalised; security review done for any auth/data/crypto/PII-touching change (§8.6, Volume 8).
6. **Clinical safety:** no invented clinical value; disclaimer preserved where simulated physiology appears; clinician-gated content unchanged without approval (§7.2).
7. **Accessibility:** new UI meets the Volume 7 a11y bar (labels, contrast, dynamic type, screen-reader order).
8. **Docs in sync:** README/DESIGN/affected spec volume updated; public APIs documented; ADR added if an architectural decision was made.
9. **No silent debt:** any shortcut is logged as a `TODO(BUILD-xxx)` with a backlog entry.
10. **Reviewable:** PR is scoped, the §9.4 checklist is satisfied, and the self-review (§6.4) is recorded in the PR description.

---

## 6. Working agreement for the AI agent

### 6.1 Plan before acting

For any non-trivial task the agent first produces a short plan: the target module, the boundary crossed, the files it expects to touch, the tests it will write, the APIs it must verify (§7.1), and any clinical values it must source (§7.2). It surfaces this plan and confirms the task meets the DoR (§5.1) before editing.

### 6.2 When to ask vs proceed

| Proceed without asking | Ask for clarification first |
|------------------------|-----------------------------|
| Acceptance criteria are unambiguous and within one module | Acceptance criteria conflict with a spec volume |
| Pattern already exists in the repo to follow | The change requires a new clinical value or threshold |
| Reversible, well-tested, in-scope change | A second, out-of-scope problem is discovered (log it, don't fix it silently) |
| Mechanical refactor with green tests | The change crosses a security/compliance boundary in an unspecified way |
| | An external API cannot be verified at the pinned version |

When in doubt about anything clinical, security-related, or scope-expanding: **stop and ask.**

### 6.3 Keep changes scoped

One task → one branch → one focused PR. Discovered-but-unrelated issues become backlog items (§14) referenced from the PR, not bundled into it. Refactors that are *necessary* to the task are allowed but called out separately in the PR description.

### 6.4 Self-review before declaring done

Before reporting completion the agent walks the **entire DoD (§5.2)** explicitly and the guardrail checklist (§7), runs all gates, re-reads its own diff for accidental scope, leftover debug code, PHI in logs, and unverified APIs, and records the self-review in the PR body.

### 6.5 Tests before commit

The agent writes/updates tests and runs `npm run typecheck && npm run lint && npm test && npm run smoke` **before** each commit. A red gate is never committed. If a gate cannot pass, the agent stops and reports rather than weakening the test.

### 6.6 Avoid drift and debt

The agent matches existing patterns (naming, layering, error handling), does not introduce a new state-management or networking paradigm without an ADR, and does not duplicate logic that already exists in `engine/`, `data/`, or `state/`. Architectural changes require an ADR (§11) reviewed by a human.

### 6.7 Keep docs in sync

Any change to behaviour, data model, scripts, or architecture updates the corresponding doc in the *same* PR (README code-map, DESIGN model notes, the relevant spec volume, ADRs). Stale docs are a DoD failure.

---

## 7. Guardrails & STOP-and-verify checkpoints

These are hard stops. The agent must halt and satisfy the checkpoint before continuing.

### 7.1 STOP — verify the API before you call it

**Trigger:** about to use any external symbol (library function, Expo/RN API, hook, endpoint, FHIR field).
**Action:** confirm it exists at the version pinned in `package.json` (or in the owning spec). Check the installed package, official docs, or types. If it cannot be verified, **do not use it** — choose a verified alternative or ask. Never approximate an API signature from memory.

### 7.2 STOP — clinical value / safety copy

**Trigger:** about to add or change a marker band, organ-impact weight, reference range, alert threshold, dosing rule, lesson fact, or user-facing health message.
**Action:** confirm the value's source. Teaching constants live in `DESIGN.md` and `engine/physiology.ts` and may change only with a cited rationale + clinician sign-off in an ADR. Real clinical values must come from Volume 5/6/8 with a citation. **Never** synthesize a clinical number from training data. Preserve the educational-only disclaimer.

### 7.3 STOP — scope expansion

**Trigger:** the task is growing beyond its acceptance criteria, or a second unrelated problem appears.
**Action:** stop, capture the extra work as a new backlog item (§14), and keep the current PR to its original scope. Re-plan if the *original* task itself proves larger than one increment.

### 7.4 STOP — skipping or weakening a test

**Trigger:** tempted to `skip`/`only`/delete a test, lower a coverage gate, or commit with a red gate.
**Action:** do not. Fix the code or fix a genuinely-wrong test (with justification in the PR). A failing gate is a signal, not an obstacle.

### 7.5 STOP — architectural drift

**Trigger:** about to put I/O into `engine/`, reach into storage from a component, introduce a new cross-cutting paradigm, or create a circular dependency.
**Action:** stop. Either keep the change within existing boundaries or write an ADR and get human review first.

### 7.6 STOP — PHI / secrets

**Trigger:** about to log, serialise, send to analytics/third-party, or commit anything containing patient data, tokens, or secrets.
**Action:** do not. Redact, externalise to config/secret store, and apply Volume 8 handling. No PHI in commit messages or fixtures either.

### 7.7 Anti-hallucination summary

Do not invent: API signatures, config keys, file paths, env var names, clinical values, spec requirement IDs, or test results. If unknown — verify or ask. Reporting a test as passing without running it is a critical violation.

---

## 8. Coding standards & conventions

### 8.1 TypeScript strictness

`tsconfig.json` sets `"strict": true` (extending `expo/tsconfig.base`). Keep it. No `any` without a justified `// eslint-disable-next-line` and a comment; prefer `unknown` + narrowing. No non-null `!` to silence the compiler; handle the absent case. `npm run typecheck` must stay green.

### 8.2 Naming

- Files: domain modules `camelCase.ts` (`physiology.ts`); React components `PascalCase.tsx` (`OrganCard.tsx`); tests `*.test.ts(x)` colocated with the unit.
- Types/interfaces/components: `PascalCase`. Functions/variables: `camelCase`. Constants: `UPPER_SNAKE` only for true module-level constants.
- Names state intent (`applyActionEffects`, not `process`).

### 8.3 Module boundaries

Preserve the existing layering (§3.3): `engine/` pure (no React/storage/network), `data/` static content, `state/` the sole persistence/orchestration seam, `components/`+`screens/` presentation. New layers (`api/`, `health/`, `ai/`) follow the same rule — a pure interface plus an implementation, domain logic kept testable. Dependencies point inward (presentation → state → engine/data), never outward from `engine/`.

### 8.4 Error handling

Pure functions return typed results or throw typed errors; callers handle them. No swallowed errors (`catch {}`). User-facing failures degrade gracefully (the app must never crash on a denied permission or a sync conflict). Errors logged for diagnostics must be PHI-free (§8.6).

### 8.5 State & persistence

State changes flow through `state/` (today `GameContext`), the single source of truth. From Phase 0, future-PHI is written through the encrypted-storage abstraction, never raw AsyncStorage. Persisted shapes are versioned with a migration path.

### 8.6 No PHI in logs (and security hygiene)

No patient identifiers, health readings, tokens, or free-text health data in logs, error messages, analytics events, crash reports, fixtures, or commit messages. Secrets come from environment/secret store, never the repo. Validate and sanitise all external input (device data, API responses, AI outputs) at the boundary.

### 8.7 Tests

Colocated `*.test.ts`. Pure logic: exhaustive of behaviours that matter (the `__smoke__.ts` assertions are the starting contract for `physiology`). Deterministic — no real time, network, or device; use fakes. Each test asserts one behaviour with a clear name.

### 8.8 Formatting & lint

Prettier-formatted, ESLint-clean (configured in Phase 0). `npm run lint` and `npm run format:check` are CI gates. No lint-disable without a reason comment.

---

## 9. Git & workflow discipline

### 9.1 Branch strategy

- `main` is always releasable and protected (no direct pushes; PR + green CI + review required).
- Work branches: `phase{N}/{epic}/{short-slug}` (e.g. `phase0/testing/jest-suite`), or `fix/…`, `chore/…`, `docs/…`.
- Short-lived; rebased on `main` before merge; squash-merge to keep history linear and one-PR-per-task.

### 9.2 Conventional commits

`type(scope): summary` — types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `ci`, `build`, `perf`, `revert`. Scope is the module/area (`engine`, `state`, `ci`, `api`). Imperative, ≤ 72-char subject. Body explains *why*. **No PHI/secrets** in messages. Reference the backlog ID and breaking changes (`BREAKING CHANGE:`).

Example: `test(engine): port __smoke__ assertions to physiology.test.ts (BUILD-002)`

### 9.3 PR size & description

One task per PR, reviewable in a sitting (§2.3). The description states: what changed and why, the source volume + backlog ID, how it was tested, the self-review against DoD (§5.2), screenshots for UI, and any ADR link.

### 9.4 PR checklist (review gate)

- [ ] Maps to a backlog item; source volume cited.
- [ ] Acceptance criteria met.
- [ ] `typecheck`, `lint`, `test`, `smoke` green in CI.
- [ ] Tests added/updated; coverage gate held.
- [ ] No PHI in logs/messages/fixtures; secrets externalised; security review if applicable.
- [ ] No invented clinical values; disclaimer preserved.
- [ ] Architecture/boundaries intact; ADR added if needed.
- [ ] Accessibility checked for new UI.
- [ ] README/DESIGN/spec/ADR updated.
- [ ] Scope contained; discovered issues filed separately.

### 9.5 Review gates

Every PR needs: green CI, at least one human (or designated second-pass) approval against §9.4, and an explicit security/compliance review for any auth, data-model, crypto, PII, or AI-output change (Volume 8). CODEOWNERS routes clinical-content and security paths to the right approvers.

### 9.6 Handling failing CI

A red pipeline blocks merge — never bypass it. Diagnose from the failing job's logs, reproduce locally with the same gate command, fix the root cause (not the test), push, and confirm green. If a failure is a flaky/infra issue, file it and fix the flake; do not disable the gate.

---

## 10. DevOps / CI-CD outline

This volume doubles as the DevOps specification. It elaborates the QA/CI strategy of Volume 9 into environments, pipelines, release, and rollback.

### 10.1 Environments

| Env | Purpose | Data | Promotion |
|-----|---------|------|-----------|
| **Local** | Dev + agent work | Synthetic only | — |
| **CI** | Automated gates on every PR | Synthetic fixtures | auto on push/PR |
| **Dev/Preview** | Integrated preview per PR/branch | Synthetic | auto on merge to branch |
| **Staging** | Pre-prod, prod-like, e2e + manual UAT | Synthetic/de-identified; no real PHI until Phase 5 controls | manual gate from `main` |
| **Production** | Live | Real PHI (Phase 5 controls mandatory) | manual approval + change record |

### 10.2 CI pipeline (per PR — Phase 0 establishes this)

1. **Install** (cached deps).
2. **Static gates:** `npm run typecheck`, `npm run lint`, `npm run format:check`.
3. **Unit/integration tests:** `npm test` with coverage gate; `npm run smoke`.
4. **Security:** dependency audit / SCA, secret scanning, SAST (grows by phase per Volume 8).
5. **Build:** Expo build sanity (and web build for the clinician panel from Phase 3).
6. **Artifacts:** coverage + test reports; SBOM from Phase 5.

A PR cannot merge unless every gate is green (§9.6).

### 10.3 CD pipeline

- Merge to `main` → build → deploy to **Dev/Preview** automatically.
- Promotion to **Staging** runs e2e + smoke; manual gate.
- Promotion to **Production** requires manual approval, a change record, and (from Phase 5) the compliance evidence check.
- **Mobile releases** via EAS Build / Play Console with staged rollout (internal → closed → open track), versioned and changelogged.
- Backend/web deploys are versioned and reversible (blue-green or rolling with health checks).

### 10.4 Release plan

- **SemVer** for the app and each service; tagged releases with generated changelogs from conventional commits.
- Feature work lands behind **feature flags** (e.g. Health Connect ingestion, AI coach) so release ≠ exposure; risky features ship dark and are enabled progressively.
- Database/state migrations are forward-only with a tested rollback path; persisted-state schema is versioned (§8.5).

### 10.5 Rollback

- Mobile: halt the staged rollout and roll back to the previous track build; flags let a risky feature be disabled without a new submission.
- Backend/web: redeploy the previous known-good artifact (blue-green swap or rolling revert); migrations have a down path or are gated until forward-safe.
- Every rollback is logged with cause; a regression test is added before re-attempting.

### 10.6 Observability & operations

Structured, **PHI-free** logging; health/readiness checks; error tracking; performance and availability dashboards; alerting on SLO breaches. Audit logging (who accessed what) from Phase 1, retained per Volume 8. Incident response and on-call escalation defined before Production carries real PHI.

---

## 11. Documentation discipline & ADRs

### 11.1 What stays in sync (in the same PR)

- **README.md** — code map, scripts, status whenever they change.
- **DESIGN.md** — any change to the physiology/gamification model, bands, or weights, with rationale.
- **The owning spec volume** (01–09) — when behaviour or contract changes.
- **API docs** — auto-generated from types/OpenAPI for backend (Phase 1) and from JSDoc/TSDoc for shared libraries; generation runs in CI and the output is published, never hand-maintained.
- **ADRs** — for every architectural decision.

### 11.2 ADRs (Architecture Decision Records)

ADRs live in `docs/adr/NNNN-title.md`, numbered sequentially, immutable once accepted (superseded by a new ADR, never edited away). One is required whenever a decision changes architecture, a cross-cutting pattern, a clinical constant, or a security boundary.

**ADR template (one paragraph each):**

```
# ADR-NNNN: <short decision title>
- Status: Proposed | Accepted | Superseded by ADR-MMMM
- Date: YYYY-MM-DD
- Context: <the forces and constraints that make a decision necessary — what problem, what limits, which volumes/requirements apply.>
- Decision: <the choice made, stated plainly and actively.>
- Consequences: <what becomes easier and harder, the trade-offs accepted, follow-up work, and any clinical-safety/security/compliance impact.>
- References: <volume sections, BUILD-IDs, citations for any clinical value.>
```

---

## 12. Per-task prompt template

Use this verbatim to instruct Claude Code on a single backlog task. Fill every field; an empty field is a signal the task is not Ready (§5.1).

```
TASK: <BUILD-ID> — <one-line task title>
SOURCE VOLUME(S): <e.g. Volume 9 (QA), Volume 8 (storage)>
PHASE: <0–5>   EPIC/MILESTONE: <name>

CONTEXT (ground truth):
- Repo today: Expo ~56 / RN 0.85 / React 19 / TS strict. Gates: npm run typecheck, npm run smoke (+ npm test/lint once Phase 0 lands).
- Owning module/boundary: <e.g. src/engine/ — pure logic, no I/O>
- Relevant existing files: <paths>

GOAL: <what behaviour must exist when done>

ACCEPTANCE CRITERIA (testable):
- <criterion 1>
- <criterion 2>

CONSTRAINTS / GUARDRAILS:
- Verify any new API at the pinned version before use (no hallucinated APIs).
- Do NOT invent or change any clinical value/threshold/copy without a cited, approved source + ADR.
- No PHI/secrets in logs, errors, fixtures, or commit messages.
- Keep changes within the owning boundary; ADR if architecture changes.
- Stay in scope; file discovered issues separately.

DEFINITION OF DONE: all of §5.2 — tests (fail-before/pass-after), gates green
(typecheck/lint/test/smoke), docs + ADR updated, accessibility (if UI),
security review (if data/auth/crypto/PII), self-review recorded.

DELIVERABLE: a single focused PR, conventional commits, PR checklist (§9.4) satisfied.

PLAN FIRST: outline target files, tests, APIs to verify, and clinical values to source.
Surface the plan, confirm DoR, then implement.
```

---

## 13. Worked example — Phase 0 task

A full disciplined cycle: **spec → plan → tests → implementation → review → commit**, for converting the smoke checks into a real Jest suite.

### 13.1 The filled prompt

```
TASK: BUILD-002 — Promote engine smoke checks to a Jest unit suite
SOURCE VOLUME(S): Volume 9 (QA/testing), DESIGN.md §2 (the model contract)
PHASE: 0   EPIC/MILESTONE: Test foundation

CONTEXT:
- Repo today: Expo ~56 / RN 0.85 / React 19 / TS strict. Gates: typecheck, smoke.
- Owning module/boundary: src/engine/ — pure logic, no I/O (safe to unit test directly).
- Existing files: src/engine/__smoke__.ts (assertion source of truth),
  src/engine/physiology.ts, src/data/actions.ts.

GOAL: A real Jest suite encodes the existing model invariants so they run in CI,
with `npm test`, without changing engine behaviour.

ACCEPTANCE CRITERIA:
- `npm test` runs Jest over TS and is green.
- Tests cover the four __smoke__ invariants: healthy routine raises heart & kidney
  above baseline; poor routine lowers them; organ health stays within [0,100].
- ts-jest/babel configured for TS strict; coverage reported for src/engine/**.
- Behaviour of physiology.ts is unchanged (no logic edits).

CONSTRAINTS: verify jest/ts-jest versions before adding; no clinical-value changes
(teaching constants stay as documented in DESIGN.md); no scope creep into other modules.

DOD: §5.2.  DELIVERABLE: one PR.  PLAN FIRST.
```

### 13.2 Plan (agent surfaces this first)

- Verify `jest` + `ts-jest` (or `babel-jest` with the Expo preset) versions compatible with TS `~6.0.3` / RN 0.85 **before** adding (§7.1).
- New files: `src/engine/physiology.test.ts`, `jest.config.js`; edit `package.json` (`test` script + devDeps).
- Translate each `expect(...)` assertion in `__smoke__.ts` into a named Jest case using the same `simulate()` helper and the real `actions.ts` ids.
- No edits to `physiology.ts` (behaviour must not change).
- Update README (scripts) and add coverage gate to CI in the sibling Phase-0 CI task.

### 13.3 Tests first (fail before)

Write `physiology.test.ts` mirroring the smoke invariants — e.g. a `"healthy routine improves the heart"` case asserting `organs.heart > 70`, a poor-routine case asserting `< 70`, and bounds cases asserting `[0,100]`. Run `npm test` and confirm it executes (red until Jest is wired), establishing the fail-before state.

### 13.4 Implementation (minimal, in scope)

Add `jest.config.js` (preset/transform for TS), the `"test": "jest"` script, and the verified devDependencies. Make the suite green. **Do not** touch engine logic. Keep `__smoke__.ts` as a lightweight runtime check or have it delegate, per the Phase-0 decision (record in an ADR if removed).

### 13.5 Self-review (against DoD §5.2)

Run `npm run typecheck && npm run lint && npm test && npm run smoke` — all green. Re-read the diff: no engine logic changed, no new deps unverified, no clinical values altered, no PHI, scope limited to the test foundation. Coverage on `src/engine/**` meets the gate. README scripts updated.

### 13.6 Commit & PR

```
test(engine): port __smoke__ invariants to a Jest suite (BUILD-002)

Add jest + ts-jest, jest.config.js, and physiology.test.ts encoding the four
model invariants from __smoke__.ts. No engine logic changed. Adds `npm test`
and coverage on src/engine/**. Source: Volume 9.
```

PR description includes the §9.4 checklist and the §13.5 self-review. CI must be green before merge.

---

## 14. Master backlog table

Dependency-ordered. IDs are stable; "Source" cites the owning volume; "Acceptance" is the testable bar. This is the canonical sequencing reference; expand each task with the §12 template before starting.

| ID | Epic | Milestone / Task | Phase | Dependencies | Source volume | Acceptance |
|----|------|------------------|-------|--------------|---------------|------------|
| BUILD-001 | Test foundation | Configure Jest + ts-jest; add `npm test` | 0 | — | V9 | `npm test` runs TS tests; CI-ready |
| BUILD-002 | Test foundation | Port `__smoke__` invariants to Jest suite | 0 | BUILD-001 | V9, DESIGN§2 | 4 invariants green; engine logic unchanged |
| BUILD-003 | Test foundation | Add gamification unit tests (XP/levels/forgiving streak) | 0 | BUILD-001 | V9, DESIGN§3 | SDT rules incl. grace-day covered |
| BUILD-004 | Lint/format | ESLint + Prettier (TS-strict ruleset); `lint`/`format:check` | 0 | — | V7, V9 | Repo lint-clean; gates added |
| BUILD-005 | CI | GitHub Actions: typecheck+lint+test+smoke on PR | 0 | BUILD-001,004 | V9 | Green pipeline blocks merge on failure |
| BUILD-006 | Secure storage | Encrypted at-rest abstraction behind `state/` | 0 | — | V8 | Future-PHI never raw-AsyncStorage; tested |
| BUILD-007 | Consent/disclaimer | Verify educational-only + consent/onboarding surfaces | 0 | — | V1, V8 | Disclaimer visible; consent flow present |
| BUILD-008 | Repo hygiene | ADR dir, PR template, CONTRIBUTING, CODEOWNERS | 0 | — | V10 | Templates + ownership routing in place |
| BUILD-009 | Backend | API service + schema scaffold | 1 | BUILD-005,006 | V4 | Versioned API; contract tests |
| BUILD-010 | Auth | OAuth2/OIDC + role model (patient/clinician/admin) | 1 | BUILD-009 | V4, V8 | Authn/authz tested; RBAC enforced |
| BUILD-011 | Sync | Offline-first sync + conflict reconciliation | 1 | BUILD-009,010 | V4, V2 | Round-trip + conflict tests green |
| BUILD-012 | Audit | PHI-free audit logging | 1 | BUILD-009 | V8 | Access events logged; no PHI in logs |
| BUILD-013 | FHIR | FHIR resource mappers for exchanged data | 1 | BUILD-009 | V4 | Mappers validated against FHIR profiles |
| BUILD-014 | Devices | `health/` adapter interface + fake device | 2 | BUILD-011 | V5 | Pure interface; covered by tests |
| BUILD-015 | Health Connect | Android Health Connect steps ingestion (flagged) | 2 | BUILD-014 | V5, V8 | Steps auto-log; permission-denied handled |
| BUILD-016 | BLE devices | CGM/BGM/BP/scale adapters behind interface | 2 | BUILD-014 | V5 | Adapters phased; integration tests |
| BUILD-017 | Clinician panel | Web client + clinician auth/roles | 3 | BUILD-010 | V3, V7 | RBAC-gated web app; e2e smoke |
| BUILD-018 | Content review | Clinician content-approval workflow | 3 | BUILD-017 | V3, V1 | Review→approve gate; audited; e2e tested |
| BUILD-019 | AI coach | Coaching service + hard safety-filter layer | 4 | BUILD-011,018 | V6, V8 | Filter blocks red-team corpus |
| BUILD-020 | AI safety | Red-team test suite + escalation/HITL paths | 4 | BUILD-019 | V6, V8 | No unsafe output; disclaimer on all surfaces |
| BUILD-021 | Compliance | Threat model + pen-test remediation | 5 | all | V8 | High/criticals closed; ASVS targets met |
| BUILD-022 | Privacy rights | GDPR export/delete + DPIA/RoPA | 5 | BUILD-009..020 | V8 | Data-subject rights demonstrable |
| BUILD-023 | Supply chain | SBOM + dependency/secret scanning in CI | 5 | BUILD-005 | V8, V9 | SBOM published; SCA gates enforced |
| BUILD-024 | Release | EAS/Play staged rollout + rollback drill | 5 | BUILD-005 | V9, V10 | Staged release + verified rollback path |

---

## 15. Build & operations requirements (BUILD-NNN)

Numbered, testable requirements for the build process and operations. These constrain *how* the work is done and are auditable.

- **BUILD-R-001 — Green gates on every commit.** Every commit to a work branch keeps `npm run typecheck` and `npm run smoke` green (and `lint`/`test` once Phase 0 lands). *Acceptance:* CI fails any PR with a red gate; no merge possible.
- **BUILD-R-002 — One task per PR.** Each PR maps to exactly one backlog ID and stays within one reviewable increment. *Acceptance:* PR description cites a `BUILD-xxx`; reviewer rejects bundled/oversized PRs.
- **BUILD-R-003 — Tests ship with code.** New/changed pure logic has fail-before/pass-after unit tests; coverage gate (≥ 80% on `src/engine/**`, extended per phase) holds. *Acceptance:* coverage report in CI; gate enforced.
- **BUILD-R-004 — No unverified APIs.** No external symbol is used without version-pinned verification. *Acceptance:* review confirms each new dependency/API is real at the pinned version; no runtime "module not found"/signature errors.
- **BUILD-R-005 — No invented clinical values.** No clinical value/threshold/copy is added or changed without a cited, clinician-approved source recorded in an ADR. *Acceptance:* any such change links an ADR + citation; clinical-content CODEOWNER approves.
- **BUILD-R-006 — No PHI/secrets in repo or telemetry.** No PHI or secrets appear in logs, errors, analytics, fixtures, or commit messages; secrets are externalised. *Acceptance:* secret scanning + PHI-redaction review pass; security CODEOWNER approves data-touching PRs.
- **BUILD-R-007 — Architecture preserved.** Domain logic in `engine/` stays pure; persistence stays in `state/`; no new circular deps; new layers follow the interface+impl rule. *Acceptance:* dependency lint/review; ADR present for any boundary change.
- **BUILD-R-008 — Docs in sync.** README/DESIGN/owning-spec/ADR updated in the same PR as the behaviour change; API docs auto-generated in CI. *Acceptance:* reviewer confirms doc deltas; doc-gen step green.
- **BUILD-R-009 — Accessibility for new UI.** New UI meets the Volume 7 a11y bar. *Acceptance:* a11y checklist in the PR; automated a11y checks where available.
- **BUILD-R-010 — `main` always releasable.** `main` is protected, requires green CI + review, and is deployable to Dev/Preview automatically. *Acceptance:* branch protection enforced; preview deploy succeeds on merge.
- **BUILD-R-011 — Feature-flagged risky features.** Health Connect ingestion, BLE, and the AI coach ship behind flags; release ≠ exposure. *Acceptance:* flag gates the feature; off by default until approved.
- **BUILD-R-012 — Reversible deploys & migrations.** Every deploy has a tested rollback; persisted-state and DB migrations are versioned with a down/forward-safe path. *Acceptance:* rollback drill (BUILD-024) passes; migration tests green.
- **BUILD-R-013 — Self-review recorded.** Every PR records the DoD (§5.2) and guardrail (§7) self-review. *Acceptance:* PR body contains the completed checklist; reviewer verifies.
- **BUILD-R-014 — Scope discipline.** Discovered out-of-scope issues are filed as new backlog items, not folded into the current PR. *Acceptance:* linked follow-up issue; PR diff limited to the task.
- **BUILD-R-015 — Phase-gating respected.** No task starts before its phase dependencies (§4.7) are satisfied. *Acceptance:* backlog dependency check at planning; tech-lead gate per phase exit criteria.

---

## 16. Traceability & cross-references

This volume operationalises the entire suite; each sibling volume feeds specific phases, requirements, and gates here.

- **[01-product-vision.md](01-product-vision.md)** — vision, phased roadmap, and the educational-only framing that gates clinical work (Phase 0 BUILD-007; guardrail §7.2).
- **[02-android-app-prd.md](02-android-app-prd.md)** — app data model and behaviours implemented across Phases 0–2 (BUILD-006, 011, 015).
- **[03-doctor-panel.md](03-doctor-panel.md)** — clinician web panel and content-review workflow built in Phase 3 (BUILD-017, 018).
- **[04-backend.md](04-backend.md)** — API, auth, sync, and FHIR layer built in Phase 1 (BUILD-009..013); shapes the CI/CD service pipelines (§10).
- **[05-medical-devices.md](05-medical-devices.md)** — Health Connect and BLE device integration in Phase 2 (BUILD-014..016); source for device-related clinical values (§7.2).
- **[06-ai-system.md](06-ai-system.md)** — AI Health Coach and its safety filters in Phase 4 (BUILD-019, 020); source for all coach safety rules (§7.2).
- **[07-uiux-design-system.md](07-uiux-design-system.md)** — design tokens, lint conventions, and the accessibility bar enforced in the DoD and §15 (BUILD-004, BUILD-R-009).
- **[08-security-compliance.md](08-security-compliance.md)** — HIPAA/GDPR/OWASP posture driving encrypted storage, audit, RBAC, PHI rules, and Phase 5 (BUILD-006, 010, 012, 021..023; guardrails §7.6).
- **[09-qa-testing.md](09-qa-testing.md)** — the QA and CI strategy that this playbook's test foundation, gates, and pipelines (§5, §10, Phase 0) operationalise (BUILD-001..005, 023, 024).

_End of Volume 10 — and of the Diabetes Quest Specification Suite._
