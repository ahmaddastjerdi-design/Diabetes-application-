# `apps/clinician-web` — Clinician Web Panel (stub)

The web app clinicians use to monitor and support patients. **Spec:** [Volume 3 — Doctor / Clinician Panel](../../../docs/specification/03-doctor-panel.md) · design [Volume 7](../../../docs/specification/07-uiux-design-system.md).

Responsive desktop-first React web app that shares `@diabetes-quest/shared` and the
Material 3 design tokens with the mobile app, and reads the same FHIR-backed data via
`services/backend`.

## First tasks (Vol 10 Phase 3)

1. Auth + MFA login; consent/role-gated access (`FR-DOC-`, `SEC-`).
2. Patient roster / population dashboard with risk stratification.
3. Individual patient timeline + AGP-style trend graphs + the organ-health view.
4. Decision-support rules (clinician aids — never autonomous diagnosis).
5. Reports export (FHIR `DiagnosticReport` / `DocumentReference`).

**Depends on:** `services/backend` (Phase 1). **DoD:** WCAG 2.2 AA; every clinician
access audited (Vol 8); decision-support clearly labelled as advisory.
