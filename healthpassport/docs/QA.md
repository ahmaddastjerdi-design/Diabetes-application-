# HealthPassport Pro — QA & Verification

Owner: QA/Test Engineer

## Automated (release-blocking, run in CI)

`npm run typecheck && npm run lint && npm test && npm run build` — see
`.github/workflows/healthpassport-ci.yml`. `npm audit --audit-level=high` also
gates the build.

Test coverage of the load-bearing logic (Vitest):

| Area | What is asserted |
|------|------------------|
| Crypto (`cryptoService.test.ts`) | AES-GCM round-trip; rejection on wrong key, AAD swap, and tampered ciphertext; deterministic hashing |
| Store (`localStore.test.ts`) | Vault init/unlock/lock; wrong-passphrase; PHI is ciphertext at rest; locked reads rejected; audit hash-chain verify + tamper detection |
| Domain (`units.test.ts`) | Unit conversions and the estimated-HbA1c formula |
| Safety (`engine.test.ts`) | Red-flag escalation thresholds; unit-conversion before evaluation; reference comparison; symptom + disposition ordering |
| Chronic (`analytics.test.ts`) | Series build/convert/sort, A1c threshold, BP components, trend, care-module inference |
| Report (`report.test.ts`) | FHIR Bundle conformance and R4 field names; summary + red-flag surfacing; empty record |
| App (`App.test.tsx`) | First-run onboarding gate; onboarding → unlocked flow |

## Manual / browser verification (before release)

Automated jsdom tests do not cover real layout, the service worker, RTL
rendering, or print output. Verify these on a real device/browser:

1. **Install as PWA** — the install prompt appears; the app launches standalone
   with the correct icon and theme color.
2. **Offline** — after first load, disconnect the network; the app still opens,
   unlocks, and all features work (data is local).
3. **Onboarding → lock → unlock** — set a passphrase, close/reopen: the app is
   locked; correct passphrase unlocks and data is intact; wrong passphrase is
   rejected; idle for the auto-lock window re-locks.
4. **Reading entry + escalation** — a severe-low glucose (e.g. 45 mg/dL) shows
   the emergency escalation; a normal reading saves without alarm.
5. **Chronic dashboards** — add a diabetes/hypertension condition; the matching
   Care dashboard appears with trend and target.
6. **Report** — Print/Save-as-PDF shows only the report (app chrome hidden);
   FHIR and summary downloads produce valid files.
7. **RTL** — switch to فارسی: layout mirrors correctly, text is right-aligned.
8. **Accessibility** — keyboard-only navigation reaches all controls; focus is
   visible; screen-reader labels read sensibly; reduced-motion is respected.
9. **Erase** — "Erase all data" returns the app to first-run and no ciphertext
   remains in IndexedDB.

> A committed Playwright end-to-end suite is planned for Phase 2; it is kept out
> of the default CI for now to avoid browser-download flakiness. The critical
> onboarding → persist → decrypt path is covered by the jsdom integration test.
