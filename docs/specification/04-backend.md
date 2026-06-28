# Volume 4 — Backend Architecture & Services

_Part of the Diabetes Quest Specification Suite — Volume 4 of 10._

## Abstract

Diabetes Quest today is an offline-first Android application: the patient's
simulated body (`BodyState`), gamification progress (`ProgressState`), and lesson
completion all live exclusively in on-device `AsyncStorage` under the key
`diabetes-quest/v1`. No server exists. This volume specifies the **backend
platform** that turns that single-device prototype into a synchronised,
multi-actor, clinically governed system — without sacrificing the offline-first
behaviour that makes the patient experience resilient.

The backend is the connective tissue between the Android patient app
(Volume 2), the web clinician panel (Volume 3), and the medical-device /
Health Connect ingestion layer (Volume 5). It owns identity, consent,
observation ingestion, simulation-state sync, gamification, content delivery,
notifications, clinician-patient messaging, reporting, and audit. All clinical
data is modelled on **HL7 FHIR R4**; all access is governed by **OAuth2/OIDC**
authentication and **RBAC + patient-consent** authorisation; the platform is
designed to meet **HIPAA**, **GDPR**, and **ISO 27001** obligations and to
follow **OWASP ASVS** controls. Consistent with the product's safety stance, the
backend's AI services (Volume 6) **never diagnose or prescribe**.

This document is a specification, not an implementation. It defines the
recommended stack and its justification, the service decomposition, the
authentication and authorisation models, the relational and FHIR data models and
their mapping to the app's existing types, a representative REST API, the
offline sync and conflict-resolution contract that Volume 5 depends on, the
notifications/reporting/audit subsystems, the non-functional targets, and a set
of numbered functional requirements with acceptance criteria.

## Table of contents

1. [Scope and current state](#1-scope-and-current-state)
2. [Architecture overview](#2-architecture-overview)
3. [Recommended technology stack and justification](#3-recommended-technology-stack-and-justification)
4. [Service decomposition](#4-service-decomposition)
5. [Authentication](#5-authentication)
6. [Authorisation](#6-authorisation)
7. [Data model and database specification](#7-data-model-and-database-specification)
8. [FHIR R4 mapping summary](#8-fhir-r4-mapping-summary)
9. [REST API specification](#9-rest-api-specification)
10. [Sync and conflict resolution](#10-sync-and-conflict-resolution)
11. [Notifications and scheduling](#11-notifications-and-scheduling)
12. [Reporting and analytics pipeline](#12-reporting-and-analytics-pipeline)
13. [Audit logging](#13-audit-logging)
14. [Non-functional requirements](#14-non-functional-requirements)
15. [Functional requirements](#15-functional-requirements)
16. [Migration: from local-only to synced](#16-migration-from-local-only-to-synced)
17. [Traceability and cross-references](#17-traceability-and-cross-references)

---

## 1. Scope and current state

### 1.1 What exists today

The prototype persists a single JSON blob to `AsyncStorage`:

```ts
interface PersistedState {
  body: BodyState;          // markers{glucose,systolic,hydration,ldl}, organs{heart,kidney}, day
  progress: ProgressState;  // xp, streak, graceDays, badges[], lastActiveDay
  completedLessons: string[];
}
```

There is no account, no network call, no second device, no clinician visibility,
and no audit trail. Everything the backend must provide is therefore additive,
and the cardinal constraint is that **the app must keep working with no network**
and reconcile when connectivity returns.

### 1.2 What this volume adds

- A patient **account** and a **clinician** account, federated via OIDC.
- A **server-authoritative** copy of simulation state, progress, lessons, and a
  durable, queryable **observation** history (which the app does not keep today —
  it resets markers to baseline each day).
- A **consent** model that gates whether, and which, clinicians may see a
  patient's data.
- A **sync contract** so the offline queue in the app (Volume 5) has a
  well-defined server to talk to.
- The clinician-facing read/report/message surfaces consumed by Volume 3.

### 1.3 Out of scope (delegated)

- Device pairing, Health Connect ingestion specifics, and the on-device offline
  queue implementation → **Volume 5**.
- AI summarisation/coaching service internals and guardrails → **Volume 6**.
- Threat model, key management, pen-test scope, DPIA → **Volume 8**.

---

## 2. Architecture overview

The platform is a **modular monolith with extractable service modules** behind a
single API gateway, not a fleet of independently deployed microservices. At the
target scale (tens to low-hundreds of thousands of patients) a well-bounded
modular monolith gives the strongest consistency, the simplest transactional
guarantees, and the lowest operational burden, while keeping every module behind
a clean internal interface so that the highest-traffic modules (Observation
ingest, Notifications) can be peeled off into their own deployables later
without rewrites.

```mermaid
graph TD
  subgraph Clients
    APP["Android patient app<br/>(offline-first, AsyncStorage + sync queue)"]
    WEB["Web clinician panel"]
    DEV["Devices / Health Connect<br/>(via app bridge — Vol 5)"]
  end

  subgraph Edge
    CDN["CDN / WAF"]
    GW["API Gateway<br/>(TLS term, authN, rate-limit, routing)"]
  end

  subgraph Identity
    IDP["OIDC Provider<br/>(OAuth2 / OIDC, MFA)"]
  end

  subgraph "Backend platform (modular monolith)"
    AUTH["Identity / Auth module"]
    PROF["Patient Profile module"]
    OBS["Observation Ingest module"]
    SIM["Simulation-Sync module"]
    GAM["Gamification module"]
    LES["Lessons / Content module"]
    DEVS["Device-Sync module"]
    NOT["Notifications module"]
    MSG["Messaging module"]
    REP["Reporting module"]
    ADM["Admin / Audit module"]
  end

  subgraph "FHIR layer"
    FHIR["FHIR R4 facade<br/>(Patient, Observation, Consent, Device, CareTeam...)"]
  end

  subgraph "Data stores"
    PG[("PostgreSQL<br/>OLTP + JSONB")]
    REDIS[("Redis<br/>cache, sessions, rate-limit, idempotency")]
    OBJ[("Object storage<br/>reports, attachments, exports")]
    MQ[["Message queue / stream<br/>(events, async jobs)"]]
    DW[("Analytics warehouse<br/>de-identified")]
  end

  subgraph "External"
    FCM["FCM push"]
    OBSV["Metrics / tracing / logs"]
  end

  APP --> CDN --> GW
  WEB --> CDN
  DEV --> APP
  GW --> AUTH & PROF & OBS & SIM & GAM & LES & DEVS & MSG & REP & ADM
  AUTH <--> IDP
  OBS --> FHIR
  PROF --> FHIR
  DEVS --> FHIR
  REP --> FHIR
  AUTH & PROF & OBS & SIM & GAM & LES & DEVS & MSG & REP & ADM --> PG
  AUTH & OBS & SIM --> REDIS
  REP & MSG --> OBJ
  OBS & GAM & NOT & REP --> MQ
  MQ --> NOT --> FCM
  MQ --> DW
  REP --> DW
  ADM --> PG
  GW -.-> OBSV
```

### 2.1 Key architectural principles

- **Offline-first is a server contract, not just a client trick.** Every
  mutating write the app performs carries a client-generated UUID and an
  idempotency key; the server is responsible for safe replay.
- **FHIR as the clinical lingua franca.** Clinically meaningful data
  (observations, devices, consent, care relationships) is persisted in, or
  projected to, FHIR R4 resources so the clinician panel, reporting, and any
  future interoperability (export to an EHR) speak one model.
- **The simulation is app-owned, server-mirrored.** The physiology engine
  (`physiology.ts`) runs on the device; the backend stores the resulting state
  and the action history but does **not** re-run the simulation authoritatively
  (it may re-derive for reporting). This keeps the embodied, instant feedback
  loop local and avoids round-trips.
- **Least privilege everywhere.** RBAC scopes plus consent records mean a
  clinician sees only the patients who have an active care relationship and an
  active consent.

---

## 3. Recommended technology stack and justification

| Concern | Recommendation | Justification |
|---|---|---|
| Language / runtime | **Node.js + TypeScript** (NestJS or Fastify) | The patient app is React Native + TypeScript. A TS backend lets us **share the engine and domain types** (`BodyState`, `MarkerKey`, `ProgressState`, `ActionDef`) across the wire via a published `@dq/shared` package, eliminating a class of drift bugs between app and server. The simulation engine (`physiology.ts`, `gamification.ts`) is pure TS and can be reused server-side for report re-derivation. |
| API style | **REST + JSON** over HTTPS, OpenAPI 3.1 documented | Simple, cacheable, well-understood by clinician-panel and device integrators; FHIR itself is RESTful, so the FHIR facade aligns naturally. |
| Primary database | **PostgreSQL 15+** | Strong relational integrity for the consent/relationship graph, ACID for sync transactions, JSONB for the FHIR resource bodies and the flexible `BodyState`/`ProgressState` blobs, row-level security as defence in depth, and proven HA/PITR tooling. |
| FHIR store | **FHIR-capable facade over Postgres** (e.g. HAPI FHIR or a thin in-house facade writing `fhir_resources` JSONB) | We need FHIR R4 semantics (resource versioning, search params) without the operational cost of a separate clinical database early on. The facade can later be swapped for a dedicated FHIR server behind the same interface. |
| Cache / ephemeral | **Redis** | Session/refresh-token lookups, OIDC nonce/state, rate-limit counters, **idempotency-key store**, hot read caches (timeline, leaderboard), and short-lived sync cursors. |
| Object storage | **S3-compatible bucket** (SSE, versioned) | Generated PDF reports, CSV/FHIR-bundle exports, message attachments, and signed data-export packages for GDPR access requests. |
| Message queue / stream | **A durable queue/stream** (e.g. SQS+SNS, or Kafka/NATS at scale) | Decouples ingestion from fan-out: observation-created events drive gamification recompute, notification scheduling, and the analytics pipeline asynchronously. |
| Push delivery | **Firebase Cloud Messaging (FCM)** | Android-first; the canonical push channel for Expo/RN Android. |
| Auth | **OAuth2 / OIDC provider** (Keycloak self-hosted, or a managed IdP with a BAA) | Standards-based, supports authorization-code + PKCE for the mobile app, MFA enforcement for clinicians, and token introspection. |
| Observability | OpenTelemetry traces, structured logs, metrics | Required to meet the latency and availability budgets in §14 and to support audit/incident response. |
| IaC / deploy | Containerised, IaC-defined, region-pinned | Supports the data-residency requirement (§14) and reproducible DR. |

**Why not microservices from day one?** The dominant complexity here is the
consent-gated relationship graph and transactional sync — both of which want a
single consistent datastore. Premature service splitting would force distributed
transactions and eventual-consistency reasoning onto a team that mostly needs
correctness and auditability. The module boundaries below are drawn so that
extraction is a deployment decision, not a redesign.

---

## 4. Service decomposition

Each module exposes a bounded internal interface and owns a slice of the schema.

| # | Module | Responsibility | Owns (primary tables) | Key events emitted |
|---|---|---|---|---|
| 1 | **Identity / Auth** | OIDC integration, token issuance/introspection, MFA, session lifecycle, role assignment | `users`, `sessions`, `mfa_enrollments` | `user.registered`, `user.login` |
| 2 | **Patient Profile** | Demographics, condition type, locale/food preferences, FHIR `Patient` projection | `patients` | `patient.updated` |
| 3 | **Observation Ingest** | Accept measurements (self-reported, simulated marker snapshots, device readings); validate; persist; project to FHIR `Observation` | `observations` | `observation.created` |
| 4 | **Simulation-Sync** | Authoritative mirror of `BodyState`; per-day action log; sync cursor reconciliation | `simulation_state`, `action_log` | `simulation.synced` |
| 5 | **Gamification** | Mirror of `ProgressState` (xp/streak/grace/badges), server-side badge reconciliation, optional leaderboards | `progress`, `badge_awards` | `progress.updated`, `badge.earned` |
| 6 | **Lessons / Content** | Versioned lesson catalog, quiz definitions, per-patient completion | `lessons`, `lessons_progress` | `lesson.completed` |
| 7 | **Device-Sync** | Device registration/pairing metadata, Health Connect mapping, dedup of device-sourced observations (specifics → Vol 5) | `devices` | `device.linked`, `device.reading` |
| 8 | **Notifications** | Reminder scheduling, push fan-out via FCM, quiet hours, delivery receipts | `notifications`, `notification_schedules` | `notification.sent` |
| 9 | **Messaging** | Asynchronous clinician↔patient messages, attachments, read receipts (not real-time chat, not for emergencies) | `messages`, `message_threads` | `message.posted` |
| 10 | **Reporting** | On-demand and scheduled clinical summaries, timeline aggregation, PDF/FHIR exports, GDPR data exports | `reports` | `report.generated` |
| 11 | **Admin / Audit** | Immutable audit trail, admin actions, consent administration, data-subject requests | `audit_log`, `consents` (admin path) | `audit.appended` |

> The **Gamification** and **Simulation-Sync** modules exist because the app's
> two largest pieces of state (`BodyState`, `ProgressState`) have different
> change cadences and access patterns: simulation state is high-write and
> patient-private; progress is read by the clinician panel for engagement
> reporting and by future social features.

---

## 5. Authentication

### 5.1 Protocol

All authentication is **OAuth2 / OIDC**. There are two flows:

- **Patient (mobile)** — Authorization Code flow with **PKCE** (no client
  secret on device). The app opens the system browser / custom tab to the OIDC
  provider, receives an authorization code, and exchanges it for tokens.
- **Clinician (web)** — Authorization Code flow with PKCE, plus **mandatory MFA**
  (TOTP or WebAuthn) enforced by the IdP before token issuance.

The API gateway validates the **access token** (JWT, RS256, audience
`dq-api`) on every request, or performs token introspection for opaque tokens.
Patient identity, role, and consent context are derived from claims plus a
server-side lookup (claims are not trusted for authorisation decisions beyond
identity — see §6).

### 5.2 Token lifetimes

| Token | Lifetime | Notes |
|---|---|---|
| Access token (patient) | **15 minutes** | Short, to bound the blast radius of a leaked token on a mobile device. |
| Access token (clinician) | **10 minutes** | Tighter for the higher-privilege actor. |
| Refresh token (patient) | **30 days**, sliding, **rotating** | Refresh-token rotation with reuse detection; a replayed (already-rotated) refresh token revokes the whole chain. |
| Refresh token (clinician) | **12 hours** | Forces frequent re-auth; clinicians work in sessions, not for weeks. |
| ID token | request-scoped | Used at login only. |
| MFA "remember device" (clinician) | **8 hours** | Optional; never skips primary auth. |

Refresh tokens are stored hashed in `sessions` and on-device in the Android
**Keystore-backed** secure storage (never in `AsyncStorage`). Logout and
"sign out all devices" revoke server-side sessions immediately.

### 5.3 MFA

- **Clinicians: MFA is mandatory.** No clinician access token is issued without a
  satisfied second factor. Enrolment is required at first login.
- **Patients: MFA is optional but offered**, and may be made mandatory by an
  organisation policy. Account-recovery and email/phone verification are
  required regardless.

### 5.4 Service-to-service

Internal module calls in the monolith are in-process; if/when modules are
extracted they authenticate via the OAuth2 **client-credentials** grant with
mutually authenticated TLS.

---

## 6. Authorisation

Authorisation is **RBAC layered with consent-based and relationship-based
access control**. A request is permitted only if *all three* gates pass.

### 6.1 Roles (RBAC)

| Role | Capability summary |
|---|---|
| `patient` | Full read/write on **own** data only. |
| `clinician` | Read clinical data, write annotations/messages/reports for patients to whom they have an **active care relationship** *and* an **active consent**. Never writes a patient's simulation/progress. |
| `care_admin` | Manages clinician↔patient relationships and care teams within an organisation; cannot read clinical observation detail. |
| `system_admin` | Platform configuration, content publishing; **no** access to patient clinical data; all actions audited. |
| `auditor` | Read-only access to `audit_log` and consent records; no clinical data. |
| `service` | Internal module/integration identity, scoped per module. |

Roles map to OAuth2 **scopes** (e.g. `obs:write`, `obs:read`, `patient:read`,
`consent:admin`, `message:write`). The gateway enforces scope presence; the
module enforces the row-level checks below.

### 6.2 Consent-based access control

A clinician's access to a patient's data is gated by an **active `Consent`
record** (FHIR `Consent`, §8). Consent is:

- **Scoped** — a patient may consent to share *observations and reports* but not
  *messages history*, or limit a clinician to a date range or specific
  categories (e.g. glucose only).
- **Time-boxed and revocable** — consent has `valid_from`/`valid_until` and can
  be revoked instantly; revocation takes effect on the next request (no cached
  bypass beyond the consent-cache TTL of ≤60s).
- **Auditable** — every grant/revoke writes to `audit_log`.

### 6.3 Relationship gating (clinician–patient)

Even with consent, a clinician must be on the patient's **CareTeam**
(`clinician_patient` relationship, FHIR `CareTeam`). The effective predicate for
a clinician read on patient *P*:

```
allow(clinician C, patient P, action A) :=
      role(C) == 'clinician'
  AND scope_present(token(C), A)
  AND active_relationship(C, P)            -- CareTeam membership
  AND active_consent(P -> C, category(A))  -- FHIR Consent covering this data
```

This predicate is enforced in the data-access layer and, as defence in depth,
mirrored by **Postgres row-level security** policies keyed on the requesting
principal. The combination prevents the classic horizontal-access bug (a
clinician reading a patient they have no relationship with).

---

## 7. Data model and database specification

PostgreSQL is the system of record. Below are the core tables with key columns;
foreign keys and indices are noted. Timestamps are `timestamptz` (UTC). Soft
deletes use `deleted_at`; clinical rows are never hard-deleted except via a
GDPR erasure workflow that records the erasure in `audit_log`.

### 7.1 Core tables

**`users`** — one row per authenticatable principal.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `oidc_subject` | text unique | `sub` claim from the IdP |
| `email` | citext unique | |
| `role` | enum | `patient` \| `clinician` \| `care_admin` \| `system_admin` \| `auditor` |
| `status` | enum | `active` \| `suspended` \| `deactivated` |
| `mfa_enrolled` | boolean | |
| `created_at`, `updated_at` | timestamptz | |

**`patients`** — patient profile; 1:1 with a `patient`-role user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | also the FHIR `Patient.id` |
| `user_id` | uuid FK→users | unique |
| `condition_type` | enum | `t1` \| `t2` \| `gestational` \| `prediabetes` \| `other` |
| `locale` | text | language / region (drives content + food options) |
| `birth_year` | int | coarse; no full DOB stored unless required |
| `timezone` | text | for reminder scheduling |
| `started_day` | int | maps to `BodyState.day` origin |
| `created_at`, `updated_at` | timestamptz | |

**`clinicians`** — clinician profile; 1:1 with a `clinician`-role user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | also FHIR `Practitioner.id` |
| `user_id` | uuid FK→users | unique |
| `organization_id` | uuid FK | |
| `npi_or_reg_no` | text | professional registration number |
| `specialty` | text | |

**`clinician_patient`** — the care relationship (FHIR `CareTeam` projection).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `clinician_id` | uuid FK→clinicians | |
| `patient_id` | uuid FK→patients | |
| `status` | enum | `active` \| `ended` |
| `started_at`, `ended_at` | timestamptz | |
| unique | (`clinician_id`,`patient_id`) where active | |

**`consents`** — patient-granted data-sharing consent (FHIR `Consent`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid FK→patients | |
| `grantee_clinician_id` | uuid FK→clinicians (nullable for org-wide) | |
| `scope_categories` | text[] | e.g. `{observation, report, progress}` |
| `valid_from`, `valid_until` | timestamptz | |
| `status` | enum | `active` \| `revoked` \| `expired` |
| `policy_version` | text | which consent text was agreed |
| `created_at`, `revoked_at` | timestamptz | |

**`observations`** — durable measurement history (FHIR `Observation`). This is
new data the app does not retain (it resets markers daily).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid FK→patients | indexed |
| `client_uuid` | uuid | client-generated; unique per patient (idempotency) |
| `marker` | enum | `glucose` \| `systolic` \| `hydration` \| `ldl` (+ device-sourced types in Vol 5) |
| `value` | numeric | |
| `unit` | text | e.g. `mg/dL`, `mmHg`, `%` |
| `source` | enum | `self_report` \| `simulation` \| `device` |
| `action_id` | text | links to the logged `ActionDef.id` when applicable |
| `effective_at` | timestamptz | when the measurement applies |
| `recorded_at` | timestamptz | when received by server |
| `device_id` | uuid FK→devices | nullable |
| `fhir_id` | uuid | id of projected FHIR Observation |
| unique | (`patient_id`,`client_uuid`) | idempotency guard |

**`simulation_state`** — server mirror of `BodyState`.

| Column | Type | Notes |
|---|---|---|
| `patient_id` | uuid PK FK→patients | one current row per patient |
| `day` | int | `BodyState.day` |
| `markers` | jsonb | `{glucose,systolic,hydration,ldl}` |
| `organs` | jsonb | `{heart,kidney}` |
| `version` | bigint | monotonic; bumped per accepted sync (optimistic concurrency) |
| `device_revision` | text | last client revision token applied |
| `updated_at` | timestamptz | |

**`action_log`** — per-day logged actions (the simulation's audit of choices).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid FK | |
| `client_uuid` | uuid | idempotency |
| `action_id` | text | `ActionDef.id` (e.g. `sugary-drink`) |
| `day` | int | simulated day |
| `effects` | jsonb | applied marker deltas |
| `logged_at` | timestamptz | |
| unique | (`patient_id`,`client_uuid`) | |

**`progress`** — server mirror of `ProgressState`.

| Column | Type | Notes |
|---|---|---|
| `patient_id` | uuid PK FK→patients | |
| `xp` | int | |
| `streak` | int | |
| `grace_days` | int | |
| `badges` | text[] | earned badge ids |
| `last_active_day` | int | |
| `version` | bigint | optimistic concurrency |
| `updated_at` | timestamptz | |

**`badge_awards`** — append-only log of badge unlocks (for timeline + audit).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid FK | |
| `badge_id` | text | e.g. `heart-hero` |
| `awarded_at` | timestamptz | |
| unique | (`patient_id`,`badge_id`) | |

**`lessons`** — versioned content catalog.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | lesson id |
| `version` | int | |
| `locale` | text | |
| `clinician_reviewed` | boolean | gate before publish (per DESIGN roadmap) |
| `body` | jsonb | structured lesson + quiz |
| `published_at` | timestamptz | |

**`lessons_progress`** — per-patient completion (mirrors `completedLessons`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid FK | |
| `lesson_id` | text FK→lessons | |
| `passed_quiz` | boolean | |
| `completed_at` | timestamptz | |
| unique | (`patient_id`,`lesson_id`) | |

**`devices`** — registered devices / Health Connect sources (detail in Vol 5).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | FHIR `Device.id` |
| `patient_id` | uuid FK | |
| `kind` | enum | `phone` \| `glucometer` \| `bp_cuff` \| `health_connect` \| `wearable` |
| `identifier` | text | manufacturer/model/serial (hashed where sensitive) |
| `status` | enum | `active` \| `revoked` |
| `linked_at`, `last_seen_at` | timestamptz | |

**`messages`** / **`message_threads`** — async clinician↔patient messaging.

| Column | Type | Notes |
|---|---|---|
| `thread_id` | uuid | groups a conversation per (patient, clinician) |
| `id` | uuid PK | |
| `sender_user_id` | uuid FK | |
| `body` | text | encrypted at rest |
| `attachment_key` | text | object-storage key, nullable |
| `read_at` | timestamptz | nullable |
| `created_at` | timestamptz | |

**`audit_log`** — immutable, append-only (see §13).

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `actor_user_id` | uuid | who |
| `actor_role` | text | |
| `action` | text | what (e.g. `observation.read`) |
| `target_type`, `target_id` | text/uuid | on what |
| `patient_id` | uuid | subject, for patient-centric audit views |
| `at` | timestamptz | when |
| `request_id` | uuid | correlation |
| `ip`, `user_agent` | text | |
| `prev_hash`, `row_hash` | bytea | tamper-evident chain |

### 7.2 Mapping app state → server tables

| App (AsyncStorage) | Server | Notes |
|---|---|---|
| `PersistedState.body.markers` | `simulation_state.markers` (jsonb) + a stream of `observations` rows | The current snapshot lives in `simulation_state`; each logged action also yields durable `observations`/`action_log` rows so history is queryable (the app discards this). |
| `PersistedState.body.organs` | `simulation_state.organs` (jsonb) | Heart/kidney scores mirrored; re-derivable from `action_log` for reports. |
| `PersistedState.body.day` | `simulation_state.day` | |
| `PersistedState.progress` | `progress` table | xp/streak/graceDays/badges/lastActiveDay map column-for-column; `badges[]` also expands into `badge_awards`. |
| `PersistedState.completedLessons` | `lessons_progress` rows | One row per completed lesson, with `passed_quiz`. |

The shared TypeScript package `@dq/shared` exports the canonical
`BodyState`/`ProgressState`/`MarkerKey`/`ActionDef` types used by *both* the app
and the server DTOs, so the mapping above is enforced at compile time.

---

## 8. FHIR R4 mapping summary

Clinically meaningful data is projected to FHIR R4 resources stored as JSONB in
`fhir_resources` and served through the FHIR facade. Gamification/XP is **not**
clinical and is **not** forced into FHIR. Deep device mappings are deferred to
Volume 5.

| Domain object | FHIR R4 resource | Mapping notes |
|---|---|---|
| Patient profile | **Patient** | `patients.id` = `Patient.id`; locale → `communication`; condition type carried as an extension or linked `Condition`. |
| Marker measurement | **Observation** | `observations` row → one `Observation`. `category = vital-signs`; `code` via LOINC where one exists (glucose → `LOINC 2339-0`; systolic BP → `8480-6`); simulation/educational markers without a clean LOINC use a Diabetes Quest `CodeSystem` and are flagged `Observation.meta.tag = educational-simulation` so they are never confused with clinical results. |
| Logged device reading | **Observation** + **Device** | `device_id` → `Observation.device`; provenance in `Observation.meta.source`. Detail in Vol 5. |
| Registered device | **Device** | `devices` row; identifiers carried in `Device.identifier`. |
| Generated clinical summary | **DiagnosticReport** | A report bundles referenced `Observation`s plus a narrative; `status` reflects clinician review. Never asserts a diagnosis (AI constraint, Vol 6). |
| Data-sharing consent | **Consent** | `consents` row; `Consent.provision` carries scope categories, period, and grantee actor; revocation sets `status = inactive`. |
| Clinician | **Practitioner** (+ **PractitionerRole**) | `clinicians.id`; org link via `PractitionerRole.organization`. |
| Care relationship | **CareTeam** | members = patient + clinician(s); `participant.member` references; `status` mirrors `clinician_patient.status`. |

> **Safety note carried from the product spec:** because the physiology engine
> is an intentionally simplified teaching model, all simulation-derived
> Observations are tagged `educational-simulation` and DiagnosticReports based on
> them carry an explicit disclaimer in `presentedForm`/narrative. The platform
> must never surface simulation values as clinical measurements.

---

## 9. REST API specification

Base path `/api/v1`. All requests require a valid bearer access token unless
noted. All responses are JSON; errors use RFC 7807 `application/problem+json`.

### 9.1 Endpoint catalog (representative)

| Method | Path | Auth / scope | Purpose |
|---|---|---|---|
| POST | `/auth/token` | public (OIDC code exchange) | Exchange auth code (PKCE) for tokens |
| POST | `/auth/refresh` | refresh token | Rotate access/refresh tokens |
| POST | `/auth/logout` | bearer | Revoke current session |
| GET | `/me` | bearer | Current principal + role |
| GET | `/patients/{id}` | `patient:read` (self) / clinician + consent | Patient profile |
| PATCH | `/patients/{id}` | self | Update profile/locale/timezone |
| POST | `/observations` | `obs:write` (self) | Submit one or many observations (idempotent) |
| GET | `/patients/{id}/observations` | self / clinician + consent | Query observation history (filter by marker, range) |
| POST | `/sync` | self | Push offline queue; pull server changes (see §10) |
| GET | `/patients/{id}/simulation` | self / clinician + consent | Current `BodyState` mirror |
| GET | `/patients/{id}/progress` | self / clinician + consent | `ProgressState` mirror |
| GET | `/patients/{id}/timeline` | self / clinician + consent | Merged chronological feed (observations, actions, badges, lessons) |
| GET | `/lessons` | bearer | Published lesson catalog for locale |
| POST | `/patients/{id}/lessons/{lessonId}/complete` | self | Record lesson completion |
| POST | `/devices` | self | Register/link a device (Vol 5) |
| GET | `/patients/{id}/devices` | self / clinician + consent | List devices |
| POST | `/consents` | self | Grant a consent |
| DELETE | `/consents/{id}` | self | Revoke a consent |
| GET | `/care/patients` | `clinician`, relationship | Clinician's patient panel |
| POST | `/messages` | self or clinician (relationship+consent) | Post a message |
| GET | `/threads/{id}/messages` | participants | Read a thread |
| POST | `/reports` | clinician + consent | Generate a DiagnosticReport |
| GET | `/reports/{id}` | participants | Fetch report (JSON or signed PDF URL) |
| POST | `/notifications/schedules` | self | Create a reminder schedule |
| GET | `/admin/audit` | `auditor` | Query the audit log |
| POST | `/admin/data-export` | self (GDPR) | Request a full personal-data export |

### 9.2 Worked example — login (OIDC code exchange)

Request:

```http
POST /api/v1/auth/token HTTP/1.1
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "Xy9...auth-code",
  "code_verifier": "h7Q...pkce-verifier",
  "client_id": "dq-android",
  "redirect_uri": "com.diabetesquest://auth"
}
```

Response `200 OK`:

```json
{
  "access_token": "eyJhbGciOiJSUzI1Ni␣...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "v2.rt.f3a1...rotating",
  "scope": "patient:read obs:write obs:read sync",
  "principal": {
    "user_id": "8f1c2b6e-...-userid",
    "role": "patient",
    "patient_id": "2a7d9f10-...-patid",
    "mfa_enrolled": false
  }
}
```

### 9.3 Worked example — submit observations / sync push

The app logs a sugary drink offline, then a balanced meal; both flush on
reconnect. Each carries a `client_uuid`; the whole batch carries an
`Idempotency-Key`.

Request:

```http
POST /api/v1/observations HTTP/1.1
Authorization: Bearer eyJhbGciOiJSUzI1Ni␣...
Idempotency-Key: 6b1f0a44-2d8e-4c77-9a1b-0d2e9b7c1f33
Content-Type: application/json

{
  "patient_id": "2a7d9f10-...-patid",
  "observations": [
    {
      "client_uuid": "c1f0a4b2-...-obs1",
      "marker": "glucose",
      "value": 205,
      "unit": "mg/dL",
      "source": "simulation",
      "action_id": "sugary-drink",
      "effective_at": "2026-06-28T08:14:00Z"
    },
    {
      "client_uuid": "d2e1b5c3-...-obs2",
      "marker": "glucose",
      "value": 170,
      "unit": "mg/dL",
      "source": "simulation",
      "action_id": "balanced-meal",
      "effective_at": "2026-06-28T12:40:00Z"
    }
  ]
}
```

Response `201 Created`:

```json
{
  "accepted": 2,
  "duplicates": 0,
  "results": [
    { "client_uuid": "c1f0a4b2-...-obs1", "id": "9aa1...srv", "fhir_id": "obs-9aa1...", "status": "created" },
    { "client_uuid": "d2e1b5c3-...-obs2", "id": "9bb2...srv", "fhir_id": "obs-9bb2...", "status": "created" }
  ],
  "server_cursor": "2026-06-28T12:40:01.220Z#118"
}
```

Replaying the identical request (same `Idempotency-Key` / `client_uuid`s)
returns `200 OK` with `"status": "duplicate"` and the original ids — no
double-write.

### 9.4 Worked example — fetch patient timeline (clinician view)

Request:

```http
GET /api/v1/patients/2a7d9f10-...-patid/timeline?from=2026-06-21&to=2026-06-28 HTTP/1.1
Authorization: Bearer eyJ...clinician-token
```

Response `200 OK`:

```json
{
  "patient_id": "2a7d9f10-...-patid",
  "range": { "from": "2026-06-21", "to": "2026-06-28" },
  "simulation": {
    "day": 41,
    "organs": { "heart": 76, "kidney": 68 }
  },
  "progress": { "xp": 1840, "level": 6, "streak": 9, "badges": ["first-step","streak-7","heart-hero"] },
  "events": [
    { "type": "observation", "marker": "glucose", "value": 205, "unit": "mg/dL",
      "source": "simulation", "action_id": "sugary-drink", "at": "2026-06-28T08:14:00Z" },
    { "type": "action", "action_id": "balanced-meal", "day": 41, "at": "2026-06-28T12:40:00Z" },
    { "type": "badge", "badge_id": "streak-7", "at": "2026-06-26T19:02:00Z" },
    { "type": "lesson", "lesson_id": "carbs-101", "passed_quiz": true, "at": "2026-06-24T07:30:00Z" }
  ],
  "disclaimer": "Marker values sourced from the educational simulation are not clinical measurements."
}
```

The server returns `403` (problem+json, type `consent-required`) if the
clinician lacks an active consent or care relationship, and writes an
`observation.read` (or `denied.read`) entry to `audit_log` either way.

---

## 10. Sync and conflict resolution

This section is the **contract Volume 5's offline queue relies on.**

### 10.1 The offline queue contract

The app maintains an append-only **outbox** of mutations. Each queued mutation
carries:

```ts
interface QueuedMutation {
  client_uuid: string;          // stable UUID, generated once, survives retries
  type: "observation" | "action" | "lesson_complete" | "progress_snapshot"
      | "simulation_snapshot";
  payload: unknown;             // typed per `type` via @dq/shared
  created_at: string;           // device clock, ISO 8601
  base_version?: number;        // for snapshot types: the version the client edited from
}
```

Guarantees the server provides:

1. **Idempotency** — `(patient_id, client_uuid)` is unique; replays are no-ops
   that return the original result. A batch-level `Idempotency-Key` makes the
   whole flush atomic and replay-safe.
2. **At-least-once delivery, exactly-once effect** — the app may resend freely;
   the server dedupes.
3. **Ordered application per patient** — mutations apply in `created_at` order
   within a patient; the server uses a monotonic `version` per patient to detect
   gaps.
4. **A pull cursor** — the sync response returns `server_cursor`; the app stores
   it and sends it on the next `/sync` to receive only newer server-side changes
   (e.g. a clinician message, a new badge reconciled server-side).

### 10.2 `/sync` round-trip

`POST /sync` carries the outbox **plus** the last `server_cursor`. The response
returns: per-mutation results (created/duplicate/conflict), the new cursor, and a
**changeset** of server-side updates to merge into local state.

### 10.3 Conflict-resolution policy (per data type)

Different state has different correct merge semantics:

| Data | Policy | Rationale |
|---|---|---|
| `observations`, `action_log`, `badge_awards`, `lessons_progress` | **Append-only, idempotent** — no conflicts possible | Immutable historical facts keyed by `client_uuid`. |
| `simulation_state` (`BodyState`) | **Last-write-wins by `version`**, with the **device's authoritative** snapshot winning when the client `base_version` is current; stale writes (`base_version < server.version`) are **rejected** and the server changeset is returned for the client to reconcile | The simulation runs on-device; the app is the source of truth for its own body state, but two devices for one patient must not clobber silently. |
| `progress` (`ProgressState`) | **Per-field merge**: `xp` = max(client, server) is wrong (double counting), so XP is **derived server-side** from the append-only `action_log` + `lessons_progress` + `badge_awards` as the source of truth; `streak`/`graceDays` recomputed from `action_log` day gaps using the same `registerActivity` logic; `badges` = **union** | Deriving from immutable events makes multi-device progress correct and tamper-resistant, rather than trusting a mutable counter. |
| `messages` | Append-only; `read_at` is per-recipient LWW | Receipts are device-local facts. |
| `consents` | Server-authoritative; client cannot override revocation | Safety/compliance. |

### 10.3.1 Note on XP derivation

The app today increments `progress.xp` locally in `logAction`/`completeLesson`.
To make sync correct and prevent client-side XP forgery, the **server**
recomputes XP and badges from the immutable event log using the shared
`XP` constants and `reconcileBadges`/`registerActivity` from `@dq/shared`. The
app keeps its optimistic local value for instant feedback; on sync, the server's
derived value is authoritative and replaces it (they will agree in the normal
case). This is a deliberate hardening over the prototype's trust-the-client model.

### 10.4 Clock handling

Device clocks are untrusted. The server stamps `recorded_at` with server time and
uses the client `effective_at`/`created_at` only for ordering within a patient,
sanity-bounded (reject timestamps absurdly in the future/past, flag for review).

---

## 11. Notifications and scheduling

### 11.1 Channels

- **Push via FCM** (primary; Android-first). The app registers an FCM token on
  login; tokens are stored on `devices`/a `push_tokens` table and refreshed.
- **In-app inbox** (durable copy of every notification, so a missed push is not
  lost).
- Email is used only for security/account events (verification, new-device
  login), never for clinical content.

### 11.2 Reminder scheduling

`notification_schedules` defines recurring reminders (e.g. medication adherence —
a proven lever per `DESIGN.md` roadmap, paired with the existing "missed dose"
mechanic). A schedule has: `patient_id`, `kind` (`med_reminder`,
`log_nudge`, `streak_protect`, `lesson_nudge`), `cron`/recurrence, `timezone`
(from `patients.timezone`), and `quiet_hours`.

A scheduler (cron worker reading from the queue) materialises due notifications,
respects quiet hours and per-patient preferences, dedupes, and fans out to FCM.
Delivery receipts update `notifications.delivered_at`/`read_at`.

The **forgiving-streak** design (from `gamification.ts`) informs the
`streak_protect` nudge: it gently reminds before a grace day is consumed, never
shames, and is rate-limited.

### 11.3 Event-driven notifications

Domain events on the queue drive notifications: `badge.earned` → congratulatory
push; `message.posted` (clinician→patient) → new-message push; `report.generated`
→ clinician notification. All are opt-out-able and audited.

---

## 12. Reporting and analytics pipeline

Two distinct planes, kept separate for privacy:

### 12.1 Operational / clinical reporting (identified)

On-demand and scheduled summaries for clinicians, built from `observations`,
`action_log`, `progress`, and `lessons_progress`, projected to FHIR
`DiagnosticReport` and optionally rendered to PDF in object storage (signed,
expiring URLs). Access is consent- and relationship-gated and fully audited.
These reports re-derive organ trends using the shared physiology engine so the
clinician view matches what the patient saw — and carry the educational-simulation
disclaimer.

### 12.2 Analytics warehouse (de-identified)

`observation.created`, `progress.updated`, `lesson.completed`, and engagement
events stream via the message queue into a **de-identified** analytics warehouse
(direct identifiers stripped/tokenised; k-anonymity thresholds on cohort
queries). This powers product/engagement analytics (retention, lesson efficacy,
streak behaviour — the questions `DESIGN.md` cares about) and population-level
health-education insights **without** exposing PHI. Re-identification is
technically and contractually prohibited; the pipeline and its governance are
detailed against the compliance controls in Volume 8.

---

## 13. Audit logging

Audit is a **HIPAA requirement** and a core control here.

- **Coverage**: every access to or mutation of patient data — reads included
  (`observation.read`, `timeline.read`, `report.read`), writes, consent
  grant/revoke, login/logout, MFA events, admin actions, and **denied** attempts.
- **Content**: who (`actor_user_id`, `actor_role`), what (`action`,
  `target_type`/`target_id`), the subject `patient_id`, when (`at`),
  correlation `request_id`, and `ip`/`user_agent`.
- **Immutability**: `audit_log` is **append-only** — no `UPDATE`/`DELETE` grants
  for the application role; enforced by table privileges and a `BEFORE
  UPDATE/DELETE` reject trigger. Rows are **hash-chained** (`row_hash =
  H(prev_hash || row_fields)`) so tampering is detectable; the chain head is
  periodically anchored to write-once object storage.
- **Retention**: per regulatory minimums (commonly 6+ years for HIPAA); exact
  retention and legal-hold handling specified in Volume 8.
- **Patient access**: patients can see an "access log" of which clinicians viewed
  their data (a GDPR-aligned transparency feature), derived from `audit_log`.

---

## 14. Non-functional requirements

| Attribute | Target | Notes |
|---|---|---|
| **Availability** | 99.9% monthly for the API (≈43 min/month budget) | Stateless app tier behind the gateway, multi-AZ DB with automated failover. Offline-first clients tolerate brief outages by queueing. |
| **Latency** | p50 < 120 ms, p95 < 400 ms for core reads (`/me`, `/simulation`, `/progress`); p95 < 600 ms for `/timeline`; `/sync` p95 < 800 ms for a typical batch | Measured server-side at the gateway; hot paths cached in Redis. |
| **Throughput / scalability** | Horizontally scalable app tier (stateless); design point ~200k patients, peak ~500 writes/s on ingest | Ingest and notifications are the first extraction candidates; the queue absorbs bursts. |
| **Durability** | No acknowledged write lost | Synchronous WAL, `201` only after commit; idempotent retries. |
| **Backup / DR** | Automated daily backups + continuous WAL archiving; **PITR**; RPO ≤ 15 min, RTO ≤ 4 h; DR drills quarterly | Object-storage backups encrypted and versioned. |
| **Data residency** | Region-pinned deployment; patient data stays in the contracted jurisdiction (EU and/or other) | IaC region parameter; no cross-region replication of PHI without a lawful basis. Supports GDPR. |
| **Security baseline** | OWASP ASVS-aligned; TLS 1.2+ in transit; AES-256 at rest; secrets in a managed vault; encrypted PII columns/messages | Full threat model and control mapping in Volume 8. |
| **Privacy** | Data minimisation; right-to-access and right-to-erasure workflows; de-identified analytics | GDPR / HIPAA. |
| **Observability** | Distributed tracing, RED metrics per endpoint, audit completeness alarms | Required to verify the budgets above. |

---

## 15. Functional requirements

Each requirement has a stable ID, statement, and acceptance criteria (AC).

**FR-BE-001 — Account & federated identity.**
The backend shall create and authenticate patient and clinician accounts via
OAuth2/OIDC.
- AC1: A patient can register and obtain tokens via authorization-code + PKCE.
- AC2: No password is ever stored by the application tier (delegated to the IdP).
- AC3: `users.oidc_subject` uniquely binds an account to its IdP subject.

**FR-BE-002 — Token lifecycle.**
The backend shall issue short-lived access tokens and rotating refresh tokens per
§5.2.
- AC1: Access tokens expire within the stated lifetime; expired tokens are
  rejected with `401`.
- AC2: Refresh-token rotation is enforced; reuse of a rotated refresh token
  revokes the chain and is audited.

**FR-BE-003 — Clinician MFA.**
The backend shall not issue a clinician access token without a satisfied second
factor.
- AC1: A clinician without MFA enrolment is forced to enrol before any clinical
  endpoint succeeds.
- AC2: MFA events are written to `audit_log`.

**FR-BE-004 — RBAC enforcement.**
The backend shall enforce role-based scopes on every endpoint.
- AC1: A `patient` token cannot read another patient's data (`403`).
- AC2: A `system_admin` token cannot read patient clinical observations (`403`).

**FR-BE-005 — Consent-gated clinician access.**
The backend shall permit clinician access to a patient's data only with an active
consent covering the requested category.
- AC1: With no/revoked consent, clinician reads return `403 consent-required`.
- AC2: Revoking consent takes effect within ≤60 s (consent-cache TTL).
- AC3: Consent scope is honoured (e.g. observation-only consent blocks message
  history).

**FR-BE-006 — Care-relationship gating.**
The backend shall require an active `clinician_patient` relationship in addition
to consent.
- AC1: A clinician not on the patient's CareTeam is denied even with a stray
  consent record, and the denial is audited.

**FR-BE-007 — Observation ingestion.**
The backend shall accept and durably store marker observations.
- AC1: Single and batch submissions persist to `observations` and project to
  FHIR `Observation`.
- AC2: Simulation-sourced observations are tagged `educational-simulation`.
- AC3: Invalid markers/units are rejected with `422` and not stored.

**FR-BE-008 — Idempotent writes.**
The backend shall make all client mutations idempotent.
- AC1: Resubmitting the same `(patient_id, client_uuid)` returns the original
  result with no duplicate row.
- AC2: A batch with an unchanged `Idempotency-Key` is a no-op replay.

**FR-BE-009 — Simulation-state sync.**
The backend shall mirror `BodyState` with optimistic concurrency.
- AC1: A snapshot with a stale `base_version` is rejected and the current
  server state is returned for reconciliation.
- AC2: `simulation_state.version` is monotonic per patient.

**FR-BE-010 — Server-derived progress.**
The backend shall derive XP, streak, grace days, and badges from the immutable
event log using the shared gamification logic.
- AC1: XP equals the value computed from `action_log` + `lessons_progress`
  using the shared `XP` constants — not a client-supplied counter.
- AC2: Badges are the union of client and server-reconciled sets; no badge is
  lost on multi-device sync.
- AC3: Streak recomputation reproduces the app's forgiving-streak behaviour
  (one grace day).

**FR-BE-011 — Lessons catalog & completion.**
The backend shall serve versioned, locale-aware, clinician-reviewed lessons and
record completion.
- AC1: Only `clinician_reviewed = true` lessons are published.
- AC2: Completion is idempotent per `(patient, lesson)` and records `passed_quiz`.

**FR-BE-012 — Patient timeline.**
The backend shall return a merged chronological timeline of observations,
actions, badges, and lessons for a date range.
- AC1: Events are ordered and filterable by range and type.
- AC2: The response includes the educational-simulation disclaimer.

**FR-BE-013 — Sync round-trip & pull cursor.**
The backend shall accept the offline outbox and return a changeset plus a new
cursor per §10.
- AC1: `/sync` returns per-mutation status and `server_cursor`.
- AC2: Re-sending with a prior cursor returns only newer server-side changes.

**FR-BE-014 — Conflict resolution.**
The backend shall resolve conflicts per the §10.3 policy matrix.
- AC1: Append-only types never conflict.
- AC2: Stale `simulation_state` writes are rejected, not silently merged.

**FR-BE-015 — Notifications.**
The backend shall schedule and deliver reminders and event notifications via FCM
with an in-app durable copy.
- AC1: Reminders fire in the patient's timezone and respect quiet hours.
- AC2: Every push has a persisted in-app inbox copy.
- AC3: All notifications are opt-out-able and audited.

**FR-BE-016 — Messaging.**
The backend shall support async clinician↔patient messaging, gated by
relationship + consent, encrypted at rest, with read receipts.
- AC1: A message is rejected if relationship/consent is absent.
- AC2: Messages carry an unambiguous "not for emergencies" notice.

**FR-BE-017 — Reporting & FHIR export.**
The backend shall generate clinician reports as FHIR `DiagnosticReport` and
support PDF and FHIR-bundle export.
- AC1: Reports reference their source `Observation`s.
- AC2: Reports never assert a diagnosis and carry the simulation disclaimer.
- AC3: Export URLs are signed and expiring.

**FR-BE-018 — Immutable audit log.**
The backend shall append an immutable, hash-chained audit record for every access
to and mutation of patient data, including denials.
- AC1: `UPDATE`/`DELETE` on `audit_log` is impossible for the app role.
- AC2: Reads of patient data produce audit entries.
- AC3: A patient can retrieve their own data-access log.

**FR-BE-019 — Data-subject rights (GDPR).**
The backend shall support data export and erasure requests.
- AC1: A patient can request a complete machine-readable export of their data.
- AC2: Erasure removes/anonymises personal data while preserving a tamper-evident
  audit record of the erasure.

**FR-BE-020 — Non-functional targets.**
The backend shall meet the availability, latency, backup/DR, and residency
targets in §14.
- AC1: Core read endpoints meet the stated p95 latency under nominal load.
- AC2: PITR restores meet RPO ≤ 15 min / RTO ≤ 4 h in DR drills.
- AC3: Patient data does not leave the contracted jurisdiction.

**FR-BE-021 — AI safety boundary.**
The backend's AI-assisted features (Volume 6) shall never diagnose or prescribe.
- AC1: AI-generated content is labelled as educational support, not medical
  advice, and passes through the guardrails defined in Volume 6.

**FR-BE-022 — Migration from local-only.**
The backend shall import a patient's existing on-device `AsyncStorage` state on
first sign-in without data loss.
- AC1: A first-login upload of `PersistedState` populates `simulation_state`,
  `progress`, `lessons_progress`, and seeds `action_log`/`badge_awards`.
- AC2: The import is idempotent (re-running does not duplicate).
- AC3: If the device has more recent state than the server (re-install),
  reconciliation follows §10.3.

---

## 16. Migration: from local-only to synced

The transition is staged so existing prototype users lose nothing:

1. **Add account (opt-in).** The app gains sign-in. Until a patient signs in, it
   behaves exactly as today (local-only). This preserves the no-network promise.
2. **First-login import.** On first successful sign-in, the app uploads its
   `PersistedState` blob to `POST /sync` as `simulation_snapshot` +
   `progress_snapshot` + a backfill of `lesson_complete` mutations. The server
   seeds the mirror tables (FR-BE-022). Because XP/badges become server-derived
   (§10.3.1), the import seeds `badge_awards` from the existing `badges[]` and
   records the current XP as a reconciliation baseline.
3. **Steady-state sync.** Thereafter every `logAction`/`completeLesson` also
   enqueues the corresponding mutation to the outbox; the app flushes on
   connectivity and merges the returned changeset.
4. **Multi-device & re-install.** Because observations/actions/lessons/badges are
   append-only and keyed by `client_uuid`, a new device that pulls the server
   changeset reconstructs the same state; `simulation_state` and `progress` are
   re-derived/LWW per §10.3.

No schema change to the app's local model is required for step 1; the local
`PersistedState` shape remains the on-device cache and offline source of truth.

---

## 17. Traceability and cross-references

| Volume | File | Relationship to this volume |
|---|---|---|
| 1 — Product Vision | `01-product-vision.md` | Establishes the patient/clinician dual-actor model and educational-not-medical-device stance the backend enforces. |
| 2 — Android App PRD | `02-android-app-prd.md` | Defines the client whose `BodyState`/`ProgressState`/`completedLessons` this backend mirrors and syncs. |
| 3 — Doctor Panel | `03-doctor-panel.md` | Primary consumer of the clinician-facing read/report/message/consent APIs in §9. |
| 5 — Medical Devices | `05-medical-devices.md` | Owns device pairing, Health Connect ingestion, and the on-device offline queue that consumes the sync contract in §10. |
| 6 — AI System | `06-ai-system.md` | Defines the AI services invoked by the backend and the never-diagnose/never-prescribe guardrails referenced in FR-BE-021. |
| 7 — UI/UX Design System | `07-uiux-design-system.md` | Consumes timeline/report/notification shapes for clinician and patient surfaces. |
| 8 — Security & Compliance | `08-security-compliance.md` | Owns the threat model, key management, retention schedule, DPIA, and the HIPAA/GDPR/ISO 27001/OWASP control mapping this volume references. |
| 9 — QA & Testing | `09-qa-testing.md` | Verifies the functional requirements (FR-BE-001…022) and the non-functional budgets (§14). |
| 10 — Build Playbook | `10-claude-code-build-playbook.md` | Sequences implementation of these services and the `@dq/shared` package. |

_End of Volume 4._
