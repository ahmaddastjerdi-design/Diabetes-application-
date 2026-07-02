# ADR-0001 — Ratify the HD-OS technology stack

- **Status:** Accepted (draft — pending Head of Engineering + Security Officer sign-off)
- **Date:** (on acceptance)
- **Deciders:** Head of Engineering (owner), Security & Privacy Officer, CMO (clinical planes)
- **Related:** `HDOS-DOC-004` §9 · CLAUDE.md §8–§13 · Meta Spec Ch. 2

## Context

HD-OS spans a patient mobile app, a clinician/admin web surface, several backend
services that must agree on one clinical data model, and clinical/AI engines. The
stack must maximise the drivers in `HDOS-DOC-004` §1 (safety, security, privacy,
explainability, interoperability, testability), work offline-first on mobile, be
FHIR-native, and minimise novel risk. A seed prototype already validates typed,
hexagonal service cores with a FHIR mapping and an offline patient app.

## Decision

Ratify:

- **Patient app:** Flutter / Dart (stable channel), **Riverpod** as the single
  sanctioned state solution (CLAUDE.md §8 `HD-STD-FLUT-0003`).
- **Clinician & admin web:** React + TypeScript, sharing Material 3 design tokens
  with the app (CLAUDE.md §14).
- **Backend services:** TypeScript on Node in strict mode, typed HTTP framework,
  each service a pure `core/` + `infra/` adapters + thin server entry.
- **Database:** PostgreSQL; forward-only migrations run in CI; field-level
  AES-256-GCM encryption for the most sensitive PHI (CLAUDE.md §10).
- **Clinical model:** HL7 FHIR R4 with standard terminologies (CLAUDE.md §11).
- **Auth:** OAuth2 / OIDC; SMART on FHIR for clinical interop (CLAUDE.md §12).

## Alternatives considered

- **React Native for the patient app** — viable and matches the seed prototype, but
  the platform standard chosen for HD-OS is Flutter (Meta Spec, CLAUDE.md §8);
  Flutter's strong RTL, accessibility, and golden-test story fit the equity and
  a11y requirements. *Not chosen* to keep one sanctioned mobile stack.
- **Polyglot backends (Go/Java/Python per service)** — rejected initially to keep
  one typed core idiom, shared contracts, and reviewer fluency; may be revisited
  per service via a superseding ADR if a scaling/ownership boundary demands it.
- **Document/NoSQL primary store** — rejected: relational integrity, auditability,
  and forward-only migrations better fit clinical data and PHI governance.

## Consequences

- **Positive:** one shared data model (`@hd-os/shared`), one mobile stack, typed
  cores that unit-test without I/O, FHIR-native from day one, low novel risk.
- **Negative / follow-ups:** the seed prototype's patient app is React Native — a
  migration path to Flutter is required and tracked (module-spec work, not core).
  Team must standardise Flutter tooling and golden-test infrastructure.
- Any change to this stack requires a **new ADR superseding this one** (no silent
  edits; CLAUDE.md §18, Constitution Art. X).
