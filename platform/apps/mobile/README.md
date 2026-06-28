# `apps/mobile` — Patient Android App (stub)

The patient-facing React Native (Expo) app. **Spec:** [Volume 2 — Android App PRD](../../../docs/specification/02-android-app-prd.md) · design [Volume 7](../../../docs/specification/07-uiux-design-system.md).

## Seed

This app is **seeded by the working prototype at the repo root** (`../../../App.tsx`,
`../../../src/…`). Phase 0 of [Volume 10](../../../docs/specification/10-claude-code-build-playbook.md)
hardens that prototype (Jest, CI, encrypted storage) in place; the migration into this
workspace package happens as the backend (`services/backend`) comes online and the app
stops being local-only.

## First tasks (Vol 10 Phase 0 → 2)

1. Promote `src/engine/__smoke__.ts` to a Jest suite; wire CI (`QA-`, `BUILD-R-`).
2. Replace unencrypted AsyncStorage with encrypted storage (`SEC-`, Vol 8).
3. Adopt `@diabetes-quest/shared` for `MarkerKey`/`ORGANS` instead of local copies.
4. Build Onboarding/consent, Settings, Device-pairing, and AI-Coach screens (`FR-AND-`).

**DoD:** every `FR-AND-` it touches has tests (Vol 9) and meets WCAG 2.2 AA (Vol 7).
