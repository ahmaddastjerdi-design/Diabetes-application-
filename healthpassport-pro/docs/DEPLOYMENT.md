# HealthPassport Pro — Deployment Guide

Status: Phase 0 · Owner: DevOps Engineer

The concrete pipeline is written in **Phase 11**. This document defines the
target environments, infrastructure, and runbook so earlier phases build toward
it. It is written to be followed by someone **new to deployment** — each step
says what it does and why.

---

## 1. Environments

| Environment | Purpose | Data |
|-------------|---------|------|
| **development** | Local coding | Local Postgres + local/dev object storage; synthetic data |
| **staging** | Pre-production verification | Isolated managed DB + storage; synthetic data only |
| **production** | Real patients | Managed DB + storage; real PHI, strict controls |

**Never put real PHI in development or staging.**

## 2. Target infrastructure (reference)
- **Hosting**: a Next.js-friendly host (e.g. Vercel) or containerized deploy.
- **Database**: managed **PostgreSQL** (e.g. Neon / Supabase / RDS) with a
  connection **pooler** and automated backups.
- **Object storage**: S3-compatible bucket (AWS S3 / Cloudflare R2 / Supabase
  Storage) for documents; private, signed-URL access only.
- **Secrets**: host secret manager / env vars — never in git.
- **CDN/edge**: for static assets and low-sensitivity cacheable content (never PHI).

## 3. Environment variables (validated at boot by `lib/security/env.ts`)
Documented in `.env.example`. Typical set:
```
DATABASE_URL=            # pooled Postgres connection string
DIRECT_URL=              # direct connection for migrations
NEXTAUTH_URL=            # canonical app URL
NEXTAUTH_SECRET=         # long random secret (never commit)
AUTH_* / provider keys   # if OAuth providers are added
STORAGE_ENDPOINT=        # S3-compatible endpoint
STORAGE_BUCKET=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
RATE_LIMIT_* / REDIS_URL # if a central limiter is used
```
The app **refuses to boot** if required vars are missing/invalid.

## 4. Database migrations
- Dev: `npx prisma migrate dev` — creates/apply migrations locally.
  *(Plain terms: updates your local database to match the schema.)*
- Staging/Prod: `npx prisma migrate deploy` — applies committed migrations only
  (no schema drift, no data loss surprises). Run as a release step, before the
  new app version serves traffic.
- Seed reference data with `npx prisma db seed` (no real PHI).

## 5. CI/CD pipeline (target)
On every push/PR: install → typecheck → lint → unit tests → build →
`npm audit` (fail on high/critical). On merge to `develop`: run E2E + axe, deploy
to **staging**. On release to `main`: run migrations (`migrate deploy`), deploy to
**production**, smoke-test.

## 6. Security at deploy
- HTTPS + HSTS; security headers (CSP etc.) set at the edge/app.
- Secrets only in the host secret store.
- Least-privilege DB and storage credentials (separate migration vs. runtime
  creds where possible).
- Backups encrypted; restore tested periodically.

## 7. Backups & disaster recovery
- Automated daily DB backups + point-in-time recovery where available.
- Object storage versioning/lifecycle.
- Documented **restore runbook**; recovery objectives (RPO/RTO) defined before
  launch.

## 8. Monitoring & observability
- Uptime + health checks; error tracking; structured PHI-scrubbed logs; DB
  slow-query + capacity metrics. Audit logging is separate from ops logging.

## 9. Rollback
- Deploys are versioned/immutable; roll back by re-pointing to the previous
  build. **Never** auto-roll-back a migration destructively — migrations are
  forward-only; use a new corrective migration if needed.

## 10. Go-live checklist (pre-production)
- ☐ Security review + penetration test complete (see [`SECURITY_CHECKLIST.md`](SECURITY_CHECKLIST.md)).
- ☐ Privacy review / DPIA complete (see [`PRIVACY_MODEL.md`](PRIVACY_MODEL.md)).
- ☐ Clinical Safety Officer sign-off on rules + content (see [`MEDICAL_SAFETY_RULES.md`](MEDICAL_SAFETY_RULES.md)).
- ☐ Accessibility audit passed (see [`ACCESSIBILITY_CHECKLIST.md`](ACCESSIBILITY_CHECKLIST.md)).
- ☐ Backups + restore tested; monitoring live; secrets set; migrations applied.
- ☐ Legal pages published (privacy, terms, medical disclaimer) and consent
  versions aligned.
