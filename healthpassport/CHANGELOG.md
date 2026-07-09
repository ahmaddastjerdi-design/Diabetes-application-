# Changelog — HealthPassport Pro

All notable changes to this product are documented here. Phases correspond to
the commits on the initial build branch.

## [0.1.0] — Phase 1 MVP (patient PWA)

The first end-to-end, launchable patient product: private, offline-first,
clinically safe, and interoperable.

### Added
- **Architecture & governance** — ARCHITECTURE, SECURITY, CLINICAL_SAFETY,
  INTEROPERABILITY, ROADMAP, QA docs and ADRs (PWA-over-native, offline-first
  encrypted store, FHIR R4 model).
- **Installable PWA** — Vite + React + TypeScript, Workbox service worker,
  offline app shell, five-section navigation, light/dark theming, English +
  Persian/Farsi (RTL) localization, accessible UI primitives.
- **Encrypted offline store** — FHIR-R4-aligned domain model; AES-GCM + PBKDF2
  (Web Crypto) encryption at rest; passphrase vault with idle auto-lock;
  tamper-evident hash-chained audit log.
- **Core PHR** — onboarding/unlock gate, profile, conditions (coded),
  medications, allergies, and readings with plausibility validation.
- **Chronic care** — diabetes and hypertension dashboards (trends, targets,
  estimated HbA1c) auto-activated from the patient's conditions.
- **Clinical safety** — three-tier disposition engine, reviewed & cited red-flag
  rules, reference-range context, red-flag symptom catalog, and governed
  educational content.
- **Reports & interoperability** — printable physician-ready summary, FHIR R4
  Bundle export, and JSON summary download.
- **Quality** — 45 unit/integration tests; CI (typecheck, lint, test, build,
  security audit); real-browser smoke verification of the critical path.

### Security & privacy
- PHI is encrypted on-device and never leaves it except by explicit
  patient-initiated export/print. No third-party trackers. Right-to-erasure wipe.

### Known limitations (tracked in ROADMAP)
- Educational content and red-flag thresholds are seed values pending formal
  Clinical Safety Officer sign-off.
- No backend/sync, physician dashboard, or DSS yet (later phases).
- Formal WCAG 2.2 AA and penetration-test audits are scheduled for Phase 2.
