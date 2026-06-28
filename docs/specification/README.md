# Diabetes Quest — Specification Suite

> **The complete, navigable software specification for taking Diabetes Quest from a
> working prototype to a clinical-grade digital-health platform.**

This directory is the single source of truth for *what* Diabetes Quest is, *why* it
exists, and *how* it is to be built. It is organised as **ten volumes**, each a
self-contained document with a stable scheme of numbered, testable requirements.

> ⚕️ **Educational positioning (today).** The shipping prototype is an **educational
> simulation — not medical advice and not a medical device.** These volumes specify
> the *path* to a clinical-grade product; the regulatory and clinical-safety gates
> that path requires are documented in Volumes 8 and 10. Nothing here authorises a
> clinical claim until those gates are met.

---

## How to read this suite

- **New to the project?** Start with **Volume 1 (Product Vision)**, then **Volume 2
  (Android App)** to see the patient experience, then skim the rest by interest.
- **Building a feature?** Find its volume below, work from its numbered requirements,
  and use **Volume 10 (Build Playbook)** for the engineering discipline (build order,
  Definition of Done, guardrails) and **Volume 9 (QA)** for the tests that gate it.
- **Reviewing safety/compliance?** Volumes **6** (AI guardrails), **8** (security &
  compliance), and **3** (clinical decision-support framing) are the core.

Every volume opens with its own abstract + table of contents and ends with a
**Traceability & cross-references** section linking the others by filename.

---

## The ten volumes

| # | Volume | What it specifies | Requirement IDs |
|---|--------|-------------------|-----------------|
| 1 | [Product Vision](./01-product-vision.md) | Vision, problem, business goals, market & competitor analysis, personas, scope, NFRs, roadmap, KPIs | `BG-`, `KPI-`, `NFR-`, `FS-`, `OOS-` |
| 2 | [Android Application PRD](./02-android-app-prd.md) | The patient app: every screen, navigation, core workflows, data model, notifications, offline, telemetry | `FR-AND-` |
| 3 | [Doctor / Clinician Panel](./03-doctor-panel.md) | The web clinician panel: roster, patient timeline, AGP & organ-health views, decision support, messaging, reports | `FR-DOC-` |
| 4 | [Backend Architecture & Services](./04-backend.md) | Services, database schema, auth/authz, FHIR mapping, REST API, sync/conflict, audit, NFRs | `FR-BE-` |
| 5 | [Medical Device Integration](./05-medical-devices.md) | Health Connect, BLE GATT, vendor cloud; CGM/BGM/BP/scale/SpO₂ → markers → FHIR; pairing, sync, certification | `FR-DEV-` |
| 6 | [AI System (AI Health Coach)](./06-ai-system.md) | Claude-powered coach: prompt architecture, guardrails, red-flag escalation, hallucination prevention, evals | `FR-AI-` |
| 7 | [UI/UX Design System](./07-uiux-design-system.md) | Material 3 foundation, design tokens, component library, data-viz, accessibility, dark mode, RTL, i18n | `DS-` |
| 8 | [Security & Compliance](./08-security-compliance.md) | HIPAA/GDPR/ISO 27001, OWASP MASVS/Mobile Top 10, encryption, STRIDE threat model, audit, IR/breach | `SEC-` |
| 9 | [Quality Assurance & Testing](./09-qa-testing.md) | Test pyramid, engine unit tests, medical-workflow validation, performance/a11y/security, CI gates, RTM | `QA-` |
| 10 | [Claude Code Master Build Playbook](./10-claude-code-build-playbook.md) | Build order (Phase 0→5), DoR/DoD, AI-agent working agreement, STOP-and-verify guardrails, DevOps/CI-CD | `BUILD-R-` |

---

## Consistency anchors

These hold across **every** volume. A change to any of them is a change to all:

- **Platform** — Android-first patient app in **React Native (Expo)**; the clinician
  panel is a **web** app that shares the data model and design tokens.
- **Differentiator** — cause-and-effect **organ-impact visualization**
  (*choice → marker → organ health*), driven by the simulation engine in
  `src/engine/physiology.ts`.
- **Motivation** — grounded in **Self-Determination Theory**; **forgiving streaks**
  (never shame a user to zero), per `src/engine/gamification.ts`.
- **Design language** — **Material Design 3**; status colour is never the only signal.
- **Standards** — **HL7 FHIR R4** for clinical data; **OAuth2 / OIDC** auth;
  **HIPAA + GDPR + ISO 27001**; **OWASP MASVS / Mobile Top 10**; **WCAG 2.2 AA**.
- **Safety-first** — the AI **never diagnoses, never doses/prescribes**, and
  **escalates red-flags to humans**; the simulation is clearly labelled as a teaching
  model and is kept strictly separate from real clinical truth.

> *Note on a known minor drift:* Volume 1 and Volume 9 set the accessibility target at
> **WCAG 2.2 AA** (the canonical anchor above); Volume 3 references WCAG 2.1 AA in one
> place. Treat **2.2 AA** as authoritative; 2.2 is backward-compatible with 2.1.

---

## Grounding in the real codebase

These are not abstract documents. Each volume is grounded in the actual prototype:

| Code | Volumes that build on it |
|------|--------------------------|
| `src/engine/physiology.ts` (markers, organs, `advanceDay`, `deviation`) | 1, 2, 4, 5, 6, 9 |
| `src/engine/gamification.ts` (XP, levels, badges, forgiving streak) | 1, 2, 4, 9 |
| `src/state/GameContext.tsx` (persisted `BodyState`/`ProgressState`) | 2, 4, 8 |
| `src/data/actions.ts`, `src/data/lessons.ts` | 2, 6 |
| `src/components/*`, `src/theme.ts` | 2, 7 |
| `src/engine/__smoke__.ts`, `package.json` scripts | 9, 10 |

See the repo [`README.md`](../../README.md) and [`DESIGN.md`](../../DESIGN.md) for the
prototype itself and the research behind it.

---

## Document conventions

- **Requirement IDs are stable.** Reference them in code, commits, PRs, and tests
  (e.g., *"implements `FR-AND-014`, tested by `QA-007`"*). Never renumber; deprecate
  instead.
- **Acceptance criteria** accompany functional requirements so QA (Volume 9) can map
  tests back to them via the requirements-traceability matrix.
- **Mermaid diagrams** render on GitHub; architecture (V4) and device lifecycle (V5)
  use them.
- These are **living documents.** Volume 10's documentation discipline requires the
  spec to be updated in the same change that alters the behaviour it describes.

---

_Diabetes Quest Specification Suite — 10 volumes. Educational simulation today; a
disciplined, safety-first path to a clinical-grade platform tomorrow._
