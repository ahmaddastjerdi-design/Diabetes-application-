# `services/backend` — Backend & FHIR Services (stub)

The platform's server: identity, profiles, observation ingest, simulation/gamification
sync, FHIR facade, notifications, messaging, reporting, and audit.
**Spec:** [Volume 4 — Backend Architecture & Services](../../../docs/specification/04-backend.md) · security [Volume 8](../../../docs/specification/08-security-compliance.md).

Recommended stack (Vol 4): Node/TypeScript modular monolith (shares types with the RN
app via `@diabetes-quest/shared`), Postgres + JSONB, a FHIR R4 facade, Redis, object
storage, and a message queue.

## First tasks (Vol 10 Phase 1)

1. OAuth2/OIDC auth; clinician MFA; RBAC + consent + care-relationship gating (`FR-BE-`, `SEC-`).
2. Core schema (users, patients, clinicians, consents, observations, event log, audit).
3. Server-derived XP/streak/badges from an **immutable event log** (don't trust the client).
4. Observation ingest + the offline sync / idempotency / conflict contract (Vol 5 relies on it).
5. Hash-chained, immutable audit logging (HIPAA).

**DoD:** every `FR-BE-` has integration tests against a real DB (Vol 9); no PHI in logs;
latency/availability targets per Vol 4 NFRs met.
