# ADR-0001 — Deliver as a PWA (not a native app) for Phase 1

- Status: Accepted
- Date: 2026-07-09
- Deciders: CPO, Principal Architect

## Context

HealthPassport Pro must reach patients on any device, install like an app, work
offline, and be updatable instantly without app-store review cycles. The
existing sibling prototype in this repository is a React Native/Expo **Android**
app tied to native modules (Health Connect, EAS builds). The new product's
requirements — cross-platform reach, offline PHR, instant updates, one codebase
for the widest audience — point elsewhere.

## Decision

Build the patient client as a **Progressive Web App** (React + TypeScript +
Vite, installable, service-worker offline). Keep the existing native prototype
untouched in the repository; HealthPassport Pro is a separate product in
`healthpassport/`.

## Consequences

**Positive**
- One codebase runs on Android, iOS, and desktop; installs to the home screen.
- Instant updates (no store review) — important for safety-content fixes.
- Web Crypto, IndexedDB, and service workers cover our offline-encrypted needs.
- Lowest-friction distribution for a launch (a URL).

**Negative / trade-offs**
- Some deep device integrations (e.g. Android Health Connect) are weaker on the
  web. Mitigation: standards-based imports (FHIR, file, and — where available —
  Web Bluetooth/health APIs); a thin native wrapper (Capacitor) remains an
  option in a later phase without changing the app core.
- iOS PWA constraints (storage eviction, push limits) must be designed around;
  export/backup mitigates storage eviction risk.

## Alternatives considered

- **React Native / Expo** (as the sibling app): great device integration, but
  weaker web reach and slower update path; heavier for a PHR whose core is data,
  not device sensors.
- **Native iOS + Android**: best platform fit, highest cost, slowest to launch,
  duplicated safety-critical logic.
