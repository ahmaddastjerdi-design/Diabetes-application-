# HealthPassport Pro — Architecture

Status: living document · Owners: Principal Architect, Health-Data Interoperability Architect

This document describes the target architecture and how we get there in phases
without accumulating rework. The guiding rule: **every phase-1 decision must not
have to be undone to reach the 1M-patient, physician-platform target.**

---

## 1. Goals and constraints

### Functional
- Patients own and manage a **personal health record** (PHR).
- **Chronic-disease care**: structured tracking, targets, and trends (diabetes,
  hypertension first).
- **Safe educational guidance** gated by a clinical-safety layer.
- **Physician-ready reports** and standards-based export.
- Later phases: physician dashboard, care pathways, DSS/AI, EHR/FHIR exchange.

### Non-functional
- **Scale**: 1,000,000 patients; 100,000 physicians in a later phase.
- **Offline-first**: fully usable with no network; sync is additive.
- **Privacy & security**: PHI encrypted at rest on device; least-privilege
  cloud; auditable. See [`SECURITY.md`](SECURITY.md).
- **Clinical safety**: no diagnosis, no prescribing; red-flag escalation. See
  [`CLINICAL_SAFETY.md`](CLINICAL_SAFETY.md).
- **Interoperability**: FHIR R4-aligned internal model. See
  [`INTEROPERABILITY.md`](INTEROPERABILITY.md).
- **Accessibility**: WCAG 2.2 AA target; multi-language incl. RTL.

---

## 2. Architecture at a glance

```
                        ┌───────────────────────────────────────────┐
                        │              Patient PWA (this phase)       │
                        │  React + TS, installable, offline-first     │
                        │                                             │
   ┌───────────┐        │   ui ──▶ features ──▶ domain ──▶ infra      │
   │  Patient  │◀──────▶│                  │           │             │
   └───────────┘        │              safety-engine    │            │
                        │                               ▼            │
                        │                 Encrypted IndexedDB (AES-GCM)│
                        └───────────────┬───────────────────────────┘
                                        │  (Phase 3+) sync over HTTPS
                                        ▼
              ┌───────────────────────────────────────────────────────┐
              │                    Cloud (later phases)                 │
              │                                                         │
              │  API Gateway ─▶ Sync/PHR service ─▶ FHIR store (R4)     │
              │        │            │                    │              │
              │        │            ├─▶ Consent service  ├─▶ Postgres   │
              │        │            ├─▶ Audit log (WORM) │   (per-region)│
              │        ▼            └─▶ Notification svc  └─▶ Object store│
              │  Physician dashboard ◀── AuthZ (RBAC/ABAC) ── IdP       │
              │        │                                                │
              │        └─▶ DSS / AI service (guarded) ─▶ EHR/FHIR gw    │
              └───────────────────────────────────────────────────────┘
```

The **patient PWA** is a complete product on its own (Phase 1–2). The cloud is
introduced additively: the PWA already speaks a FHIR-aligned model and persists
through a repository interface, so "add a backend" means implementing a remote
repository behind the same seam — not rewriting the app.

---

## 3. Client architecture (patient PWA)

Layered, dependency-inward (a light hexagonal / clean-architecture style). Inner
layers never import outer layers.

| Layer | Directory | Responsibility | May depend on |
|-------|-----------|----------------|---------------|
| **Domain** | `src/domain` | FHIR-aligned entities, value sets, units, pure clinical calculations, validation | (nothing) |
| **Safety** | `src/safety` | Clinical-safety classification, red-flag rules, disclaimer policy | domain |
| **Infrastructure** | `src/infrastructure` | Encrypted persistence, crypto, audit log, repository implementations | domain |
| **Features** | `src/features` | Use-cases + screens per capability (PHR, chronic-care, reports, education) | domain, safety, infrastructure |
| **UI** | `src/ui` | Design-system primitives, theming, a11y helpers | (nothing app-specific) |
| **App shell** | `src/app` | Routing, providers, service-worker registration, layout | all above |

**Why this shape.** The two things most likely to change — *where data lives*
(local → cloud/FHIR) and *what's clinically allowed* — are isolated behind the
`infrastructure` repository interface and the `safety` engine respectively.
Features depend on interfaces, not implementations, so both can evolve without
touching feature code.

### Key client patterns
- **Repository interface** (`domain/repository.ts`): `save`, `get`, `list`,
  `delete`, `export`. Phase 1 implementation is `EncryptedIndexedDbRepository`.
  Phase 3+ adds `SyncingRepository` (local cache + remote) behind the same type.
- **Encrypted-at-rest store**: all PHI records are AES-GCM encrypted with a key
  derived from the user's passphrase (PBKDF2) before touching IndexedDB. See
  [`SECURITY.md`](SECURITY.md).
- **Safety gate**: any surface that presents guidance or interprets data calls
  `safety.evaluate(...)`; it can *escalate*, *caveat*, or *allow*, but the app
  never renders unclassified guidance.
- **Offline-first**: Workbox service worker precaches the app shell and serves a
  stale-while-revalidate strategy for static assets. Data is local by design, so
  the app is fully functional offline with zero special-casing.
- **State**: server-state-free in Phase 1 (data is local). UI state is local to
  features; cross-cutting session/lock state lives in a small typed store.

---

## 4. Data & interoperability

The internal model mirrors a **FHIR R4** subset (Patient, Observation,
Condition, MedicationStatement, AllergyIntolerance, Immunization,
DocumentReference/DiagnosticReport). Records carry standard codes (LOINC for
observations, SNOMED CT / ICD-10 for conditions, RxNorm/ATC for medications,
UCUM for units) so export is a serialization step, not a transformation.

Rationale and the full mapping table live in
[`INTEROPERABILITY.md`](INTEROPERABILITY.md). ADR-0003 records the decision.

---

## 5. Cloud architecture (later phases — designed, not yet built)

The PWA is intentionally shippable without any of this. When we introduce the
backend it is **additive** and follows these choices:

- **API**: stateless services behind an API gateway; horizontal scale.
- **PHR/FHIR store**: a FHIR R4 server (e.g. HAPI FHIR or a managed FHIR
  service) backed by **PostgreSQL**, partitioned by patient and region.
- **Identity**: OIDC IdP; patients and physicians are separate realms; step-up
  auth (WebAuthn) for sensitive actions.
- **Authorization**: RBAC for roles + ABAC for consent-scoped record access
  (a physician may read a record only while an active, patient-granted consent
  exists). Consent is a first-class, audited service.
- **Audit**: append-only (WORM) audit log of every PHI access, satisfying
  HIPAA/GDPR accountability.
- **Async**: an event bus for notifications, care-pathway timers, and DSS jobs.
- **DSS/AI**: isolated service; all outputs pass the same clinical-safety
  contract as the client. AI never writes to the record unattended and never
  crosses from *education* into *diagnosis/treatment* without a licensed
  clinician in the loop.

### Scaling to 1,000,000 patients
- **Stateless services** + managed autoscaling; sessions in the client (JWT) not
  server memory.
- **Data partitioning** by patient id; read replicas per region; hot/cold
  storage tiers for documents/objects.
- **Sync is delta-based** (per-record version vectors) to keep payloads small
  and enable conflict resolution (last-writer-wins per field with an audit
  trail; clinical fields flagged for manual review on conflict).
- **Offline-first client absorbs load**: most reads never reach the server; the
  server is a sync + exchange point, not the interactive path.
- **Regionalization** for data-residency (GDPR / local health-data laws).

### Scaling to 100,000 physicians (later)
- Physician tenants isolated; dashboard reads are consent-scoped and cached.
- Panel/population queries served from a read model (CQRS) separate from the
  transactional FHIR store.

---

## 6. Cross-cutting concerns

- **Security**: [`SECURITY.md`](SECURITY.md) — encryption, consent, threat model.
- **Clinical safety**: [`CLINICAL_SAFETY.md`](CLINICAL_SAFETY.md) — the safety
  engine is a build-time and run-time gate, and content has a review workflow.
- **Observability** (cloud phase): structured logs (PHI-scrubbed), metrics,
  traces; audit is separate from ops logging.
- **i18n / RTL**: all copy externalized; layout is direction-aware from Phase 1
  (English + Persian/Farsi seed locales).
- **Accessibility**: semantic HTML, focus management, screen-reader labels,
  reduced-motion and high-contrast support; WCAG 2.2 AA.
- **Testing**: pure domain and safety logic are unit-tested; see
  [`ROADMAP.md`](ROADMAP.md) for the test pyramid per phase.

---

## 7. Technology choices (Phase 1)

| Concern | Choice | Why |
|---------|--------|-----|
| Language | TypeScript (strict) | Type safety across a clinical model |
| UI | React 19 | Ubiquitous, strong a11y ecosystem |
| Build/PWA | Vite + vite-plugin-pwa (Workbox) | Fast, first-class PWA/service-worker support |
| Persistence | IndexedDB via `idb` | Structured, large-capacity local store |
| Crypto | Web Crypto API (AES-GCM, PBKDF2) | Native, audited, no bespoke crypto |
| Routing | React Router | Standard client routing |
| i18n | Lightweight in-house provider + RTL | Zero-runtime-surprise, small bundle |
| Testing | Vitest + Testing Library | Fast, Vite-native |
| Charts | In-house SVG | Small bundle, full a11y control |

ADR-0001 (PWA over native) and ADR-0002 (offline-first encrypted local store)
record the two load-bearing choices.

---

## 8. What Phase 1 deliberately does *not* build

- No backend, no accounts server (local passphrase-derived key instead).
- No physician dashboard, no DSS/AI, no live EHR connection.
- No third-party analytics or trackers touching PHI (by policy, permanently).

These are sequenced in [`ROADMAP.md`](ROADMAP.md). The point of Phase 1 is a
genuinely usable, safe, private, interoperable patient product that the later
phases extend rather than replace.
