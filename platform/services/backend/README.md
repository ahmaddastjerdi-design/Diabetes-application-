# `services/backend` — Backend & FHIR Services (Phase 1)

## Phase 1 — implemented (auth + sync + audit)

**Domain core** (`src/core/`, pure, strict TS, fully unit-tested — 16 tests):

- `auth/rbac.ts` — role→action permission matrix (`hasPermission`).
- `auth/access.ts` — the PHI access decision: patient-ownership + **active-consent gating**
  (`decideAccess`, `hasActiveConsent`).
- `auth/session.ts` — OIDC claims validation: expiry, audience, **MFA-for-clinicians** (`validateClaims`).
- `audit/chain.ts` — immutable **hash-chained audit log** with tamper detection (`appendEntry`, `verifyChain`).
- `sync/merge.ts` — idempotent event dedupe + last-write-wins (`dedupeEvents`, `mergeLWW`).
- `patient-data-service.ts` — composes access→audit→action so authz/audit can't be bypassed.
- `repositories.ts` — persistence ports + in-memory adapters (used by unit tests).
- (Phase 0) `observations.ts`, `progress.ts` (server-derived XP/streak), `hash.ts`.

**Infra** (`src/infra/`, real, runs after `npm install`; verified by the CI Postgres job):

- `db.ts`, `migrate.ts` — pool + forward-only migration runner; `db/migrations/0001_init.sql`.
- `repositories.pg.ts` — Postgres adapters implementing the same ports (idempotent ingest
  via `ON CONFLICT`, DB-backed audit chain).
- `auth.ts` — OIDC/JWT verification via `jose` against the IdP JWKS.
- `src/server.ts` — Fastify API with auth preHandler + consent-gated routes.

### Run

```bash
npm install
# unit tests (no DB):
npm test -w @diabetes-quest/backend
# with a database:
DATABASE_URL=postgres://… npm run -w @diabetes-quest/backend build:full
DATABASE_URL=postgres://… npm run -w @diabetes-quest/backend migrate
DATABASE_URL=postgres://… npm run -w @diabetes-quest/backend test:integration
# dev server (OIDC_* env for real auth; falls back to insecure dev headers if unset):
npm run dev -w @diabetes-quest/backend
```

CI runs the integration suite against a real Postgres 16 service container
(`.github/workflows/ci.yml` → `backend-integration`).

### Service-integration endpoints (connect the platform end-to-end)

- `POST /v1/observations` — first-party device ingest (persisted + audited; from the device-gateway).
- `GET  /v1/patients/:id/observations` — consent-gated timeline (clinician panel + coach).
- `GET  /v1/patients/:id/coach-context` — derived grounding context for the AI coach.
- `POST /v1/escalations` — record a care-team escalation from the AI coach.

`ObservationRepo` + `EscalationRepo` have Postgres adapters (migration `0002_escalations.sql`)
and in-memory adapters; the flows are covered by unit tests and the Postgres integration suite.

**PHI at rest:** when `ENCRYPTION_KEYS` is configured, `PgObservationRepo` encrypts the
FHIR payload with AES-256-GCM (`@diabetes-quest/security`) before it touches disk and
decrypts transparently on read. The Postgres integration suite proves the raw row is
ciphertext (no plaintext glucose on disk) while reads return the original value.

### Still TODO (later phases)

FHIR facade, Redis, notifications/messaging/reporting, extend field encryption to the
remaining PHI columns + SHA-256 audit in storage, TLS-to-DB, latency/availability NFRs (Vol 4).


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
