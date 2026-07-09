# HealthPassport Pro — QA & Test Plan

Status: Phase 0 · Owner: QA/Test Engineer

Quality is enforced automatically and gated in CI. **Medical-safety and
authorization tests are release-blocking.**

---

## 1. Test pyramid & tools
- **Unit / integration** — **Vitest**: domain logic (safety rules, FHIR mapping,
  units, Zod schemas), server-action authorization, data-layer ownership scoping.
- **End-to-end** — **Playwright**: critical user journeys in a real browser,
  including offline and accessibility assertions (`@axe-core/playwright`).
- **Static** — TypeScript strict, ESLint (incl. `jsx-a11y`), Prettier.

## 2. Release-blocking gates (CI)
1. `typecheck` (tsc, strict) passes.
2. `lint` passes (no errors).
3. `test` (Vitest) passes; **safety-rule and authorization suites required**.
4. `e2e` (Playwright) smoke passes.
5. `npm audit` — no high/critical.
6. `build` (production Next.js) succeeds.

## 3. What we test per area

| Area | Representative tests |
|------|----------------------|
| **Medical safety** | Each red-flag threshold escalates correctly; unit conversion before evaluation; no interpretive surface renders without a disposition; disclaimer present on report |
| **AuthN/AuthZ** | Protected routes redirect when unauthenticated; a user cannot read/write another user's rows (IDOR); server rejects unscoped access |
| **Validation** | Zod rejects malformed input server-side; file-upload validation rejects bad type/size/magic-bytes |
| **Data model** | Soft delete hides rows; hard erasure removes rows + storage; audit rows written for CREATE/UPDATE/DELETE/EXPORT |
| **FHIR** | Mapping produces conformant resources; Bundle shape; correct code systems |
| **Charts/trends** | Series build/convert/sort; estimated-A1c threshold; empty states |
| **Accessibility** | axe has no violations on key screens; keyboard reachability; labels; focus management |
| **PWA** | Manifest valid; installable; offline shell loads; consented offline summary present/cleared correctly |

## 4. Critical E2E journeys (Playwright)
1. Register → verify → onboarding (consent + profile + emergency contact) → dashboard.
2. Add condition/medication/allergy → appears in records; soft-delete hides it.
3. Log a vital that trips a red flag → **emergency escalation** shown.
4. Upload a document (valid) → listed; invalid type rejected.
5. Generate doctor report → print view + FHIR/JSON export downloads.
6. Data export and **erase my data** flows.
7. Offline: load app offline → shell + latest summary available (with consent).
8. Authorization: user B cannot access user A's record (negative test).

## 5. Test data & privacy
- Tests use synthetic data only; **no real PHI** in fixtures or seeds.
- E2E runs against an ephemeral test database; teardown between runs.

## 6. Environments & cadence
- CI runs on every push/PR (see [`DEPLOYMENT.md`](DEPLOYMENT.md)).
- Full E2E + axe on `develop` and before release to staging/production.
- Manual pre-release checklist: accessibility (keyboard/SR/zoom), safety spot-checks,
  install/offline on a real device, print/export fidelity.

## 7. Coverage targets
- Domain/safety/auth logic: high coverage (aim ≥ 90% of `lib/medical-rules`,
  `lib/fhir`, `lib/validation`, auth/authorization helpers).
- UI: cover critical flows via E2E rather than chasing line coverage.
