# HealthPassport Pro — Architecture

Status: Phase 0 · Owners: Principal Architect, Security Engineer

This document defines the full-stack architecture and the phase plan. Guiding
rule: **no V1 decision should have to be undone to reach the 1M-patient,
multi-role target** (see [`SCALABILITY_PLAN.md`](SCALABILITY_PLAN.md)).

---

## 1. Technology stack

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | **Next.js (App Router)** | Server Components + Route Handlers; one codebase for UI + API |
| Language | **TypeScript (strict)** | `strict: true`, no implicit `any` on clinical paths |
| UI | **Tailwind CSS + shadcn/ui** | Accessible, themeable, consistent components |
| Icons | **Lucide** | Consistent, tree-shakeable icon set |
| Forms | **React Hook Form + Zod** | Same Zod schemas validate client and server |
| Charts | **Recharts** | Accessible, declarative trend charts |
| DB | **PostgreSQL** | Relational, strong constraints, mature scaling |
| ORM | **Prisma** | Type-safe queries + migrations |
| Auth | **Auth.js / NextAuth** | Session/JWT, secure cookies, provider-agnostic |
| Storage | **S3-compatible object storage** | Medical documents; DB stores metadata only |
| PWA | **manifest + service worker** | Installable, offline shell + consented summary |
| Validation | **Zod** + env validation | Runtime validation everywhere untrusted data enters |
| Tests | **Vitest** (unit) + **Playwright** (e2e) | Safety + a11y tests are release-blocking |
| Quality | **ESLint + Prettier** | Enforced in CI |

## 2. High-level shape

```
        ┌──────────────────────────────────────────────────────────┐
        │                        Browser (PWA)                      │
        │  Next.js Client Components · Tailwind/shadcn · RHF+Zod     │
        │  service worker (offline shell + consented summary cache)  │
        └───────────────┬──────────────────────────────────────────┘
                        │ HTTPS (same origin)
        ┌───────────────▼──────────────────────────────────────────┐
        │                    Next.js server                         │
        │  Server Components (read) · Server Actions / Route Handlers│
        │  ── AuthN (NextAuth) ── AuthZ (ownership checks) ──        │
        │  ── Zod validation ── audit logging ── rate limiting ──    │
        │        │                         │                        │
        │        ▼                         ▼                        │
        │   Prisma client            Storage client (S3)           │
        └────────┼─────────────────────────┼───────────────────────┘
                 ▼                          ▼
          PostgreSQL (clinical)     Object storage (documents)
```

**Every clinical read/write goes through the server**, is authenticated,
authorized against the owning `userId`, validated with Zod, and — for sensitive
create/update/delete/export — written to the audit log. The client never holds
secrets and never trusts client-side authorization.

## 3. Layered design (dependency-inward)

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **UI** | `app/**`, `components/**` | Screens, layouts, design-system components |
| **Application** | Server Actions / `app/api/**` route handlers | Orchestrate a use case: authenticate, authorize, validate, call domain + data, audit |
| **Domain** | `lib/medical-rules`, `lib/fhir`, `lib/validation` | Pure clinical logic: safety rules, FHIR mapping, Zod schemas, unit math |
| **Data** | `lib/db` (Prisma), `lib/storage` | Persistence + object storage; ownership-scoped queries |
| **Cross-cutting** | `lib/auth`, `lib/security`, `lib/audit` | Auth, security helpers, audit logging |

The **domain layer is framework-free** and portable (much of it ports from the
prior Vite prototype's tested `lib` logic — safety engine, value sets, unit
conversions, FHIR mapping).

## 4. Security & data isolation (summary)

- **Authentication**: NextAuth with secure, httpOnly, sameSite cookies.
- **Authorization**: every query is scoped to the session user's `userId`; a
  patient can only ever read/write their own rows. Server-side checks only —
  never rely on the client.
- **Validation**: Zod schemas validate all input server-side (and reuse on the
  client for UX). File uploads are validated for type/size/content.
- **Secrets**: only in server env; validated at boot (`lib/security/env.ts`).
- **Audit**: `AuditLog` records sensitive create/update/delete/export.
- **Rate limiting**: auth and write/export endpoints are rate-limited.
- **Errors**: safe error handling; no stack traces or PII to the client.

Full controls: [`SECURITY_CHECKLIST.md`](SECURITY_CHECKLIST.md). Privacy model:
[`PRIVACY_MODEL.md`](PRIVACY_MODEL.md).

## 5. Medical safety in the architecture

A single **safety layer** (`lib/medical-rules` + `components/safety`) classifies
every interpretive surface as `EMERGENCY | URGENT | ROUTINE` and drives
escalation UI. Reading/symptom entry passes through it; the app escalates, it
never diagnoses. See [`MEDICAL_SAFETY_RULES.md`](MEDICAL_SAFETY_RULES.md).

## 6. Interoperability

Internal models are **FHIR-inspired**, with mapping functions in `lib/fhir` for
Patient, Observation, Condition, MedicationRequest, AllergyIntolerance,
Encounter, CarePlan, DocumentReference. See [`FHIR_MAPPING.md`](FHIR_MAPPING.md).

## 7. Required folder structure

```
healthpassport-pro/
  app/
    (public)/
      page.tsx                 # Landing
      login/ register/ forgot-password/
      privacy/ terms/ medical-disclaimer/
    (app)/
      dashboard/
      onboarding/
      profile/
      records/
        conditions/ medications/ allergies/ documents/ encounters/
      track/
        vitals/ labs/ symptoms/ daily-checkin/
      guide/
      reports/
      settings/
      privacy-security/
    api/
      upload/                  # secure document upload
      export/                  # data export / doctor report
  components/
    ui/                        # shadcn/ui primitives
    layout/ health/ forms/ charts/ reports/ safety/
  lib/
    auth/ db/ validation/ medical-rules/ fhir/ security/ storage/ audit/ utils/
  prisma/
    schema.prisma  migrations/  seed.ts
  content/
    guides/
      diabetes.ts hypertension.ts kidney-health.ts
      cardiovascular-risk.ts dyslipidemia.ts obesity.ts adherence.ts
  tests/
    unit/  e2e/
  docs/
    PRD.md ARCHITECTURE.md DATABASE_SCHEMA.md SECURITY_CHECKLIST.md
    PRIVACY_MODEL.md MEDICAL_SAFETY_RULES.md ACCESSIBILITY_CHECKLIST.md
    SCALABILITY_PLAN.md DEPLOYMENT.md FHIR_MAPPING.md QA_TEST_PLAN.md
```

## 8. Environments & configuration

- Environments: **development**, **staging**, **production** (see
  [`DEPLOYMENT.md`](DEPLOYMENT.md)).
- All configuration via environment variables, **validated at startup** with Zod
  (`lib/security/env.ts`); the app refuses to boot with missing/invalid config.
- No secrets in the client bundle; only `NEXT_PUBLIC_*` values reach the browser,
  and none of those are secrets.

## 9. Scale posture (V1 choices that enable 1M patients)

- Indexed, **paginated** (cursor-based) queries; never load all records.
- Composite indexes on `(userId, type, recordedAt)` for observations/labs.
- Documents in object storage; DB holds metadata + keys only.
- Audit log indexed by `(userId, createdAt, action)`.
- Analytics kept separate from clinical data.
- Future: background jobs/queues, read replicas, table partitioning for
  high-volume observations. See [`SCALABILITY_PLAN.md`](SCALABILITY_PLAN.md).

## 10. Delivery phases

| Phase | Deliverable | Checkpoint |
|-------|-------------|-----------|
| 0 | Documentation (this set) | **← you are here; approve to continue** |
| 1 | Project init: Next.js, TS strict, Tailwind, shadcn/ui, ESLint/Prettier, app shell, responsive layout | |
| 2 | PostgreSQL + Prisma schema + migrations, auth, protected routes, User model, env validation | **milestone** |
| 3 | Onboarding, patient profile, consent, emergency contact | |
| 4 | Conditions, medications, allergies, encounters | |
| 5 | Vitals, labs, symptoms, daily check-in, charts | **milestone** |
| 6 | Chronic-disease guide + red-flag rules engine | |
| 7 | Document upload with secure validation + metadata | |
| 8 | Doctor report (print/export/copy) | |
| 9 | PWA manifest, service worker, offline fallback, limited offline summary | **milestone** |
| 10 | Tests, accessibility checks, security checklist, production hardening | |
| 11 | Deployment guide (staging + production) | **milestone** |

Per the founder's preference, work pauses for approval at the **milestone** rows
(and after Phase 0). Each phase ends with: summary, files changed, commands to
run, tests to run, the Git commit message, and risks/missing items.

## 11. Git strategy

Intended: `main` (production), `develop` (integration), `feature/*` (per-phase).
In this managed session, development happens on the assigned branch
`claude/healthpassport-pro-architecture-h6jnf7`; each phase is a discrete,
clearly-messaged commit. On a normal setup, map each phase to a `feature/*`
branch merged into `develop`, released to `main`.
