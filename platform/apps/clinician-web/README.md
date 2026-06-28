# `apps/clinician-web` — Clinician Web Panel (Phase 3)

The web app clinicians use to monitor and support patients. **Spec:** [Volume 3 — Doctor / Clinician Panel](../../../docs/specification/03-doctor-panel.md) · design [Volume 7](../../../docs/specification/07-uiux-design-system.md).

Responsive desktop-first React (Vite) app that shares `@diabetes-quest/shared` and the
clinical engine `@diabetes-quest/clinical` with the rest of the platform.

## Phase 3 — implemented

**Clinical engine** lives in [`packages/clinical`](../../packages/clinical) (pure,
9 unit tests): consensus CGM metrics — time-in-range, GMI, glucose variability (CV),
AGP-by-hour percentile bands — plus decision-support rules and roster risk stratification.

**Panel** (`src/`, real React; typechecked in CI):

- `screens/Roster.tsx` — population dashboard, **risk-stratified** so the highest-risk
  patient sorts first (`stratify`).
- `screens/PatientDetail.tsx` — AGP chart, time-in-range bar, GMI/CV/mean stats, and the
  decision-support flags — each labelled **"clinician aid — not diagnosis"**.
- `components/clinical.tsx` — `RiskBadge`, `TimeInRangeBar`, `AgpChart` (SVG), `FlagList`;
  colour is never the only signal (every status carries a label — Vol 7).
- `api.ts` — typed, token-authenticated client for the consent-gated backend (Phase 1).

The panel renders deterministic, **non-PHI sample data** (`data/sample.ts`) until the
backend timeline API lands.

```bash
npm install
npm run dev -w @diabetes-quest/clinician-web      # vite dev server
npm run typecheck -w @diabetes-quest/clinician-web
```

## Still TODO (later work)

1. Auth + MFA login UI; consent/role-gated session (`FR-DOC-`, `SEC-`) — backend enforces it.
2. Backend timeline endpoint (`GET …/observations`) to replace sample data.
3. Organ-health trend view, secure messaging, report export (FHIR `DiagnosticReport`).

**DoD:** WCAG 2.2 AA; every clinician access audited (Vol 8); decision-support advisory.
