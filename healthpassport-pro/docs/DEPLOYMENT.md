# HealthPassport Pro — Deployment Guide & Runbook

Status: **Phase 11 (finalized)** · Owner: DevOps Engineer

This is the operational runbook for taking HealthPassport Pro from a code
commit to a running, PHI-handling production service — and safely operating,
recovering, and rolling it back. It is written to be followed by someone **new
to deployment**: each step says *what* you run, *what it does*, and *why it
matters*. Where a step touches a medical-safety, security, or privacy control,
it links to the binding document.

> **Golden rule:** Real patient data (PHI) lives **only** in production, behind
> the full control set below. Never copy production data into development or
> staging. Never commit secrets. Never let the service worker or logs capture
> PHI.

---

## 0. Quick reference (the four commands you actually run)

| Situation | Command (run from `healthpassport-pro/`) |
|-----------|------------------------------------------|
| Update your local DB to the schema | `npx prisma migrate dev` |
| Apply already-written migrations in staging/prod | `npx prisma migrate deploy` |
| Build the production bundle | `npm run build` |
| Start the built app | `npm run start` |

Everything else in this document is context around these four.

---

## 1. Environments

| Environment | Purpose | Data | Who reaches it |
|-------------|---------|------|----------------|
| **development** | Local coding on your machine | Local Postgres + local disk object storage; **synthetic** data | Developer only |
| **staging** | Pre-production verification, demos, QA | Isolated managed DB + storage; **synthetic** data only | Team, testers |
| **production** | Real patients | Managed DB + storage; **real PHI**, strict controls | Public / patients |

**Never put real PHI in development or staging.** Staging must be a faithful
copy of production *infrastructure*, seeded only with synthetic data.

---

## 2. Prerequisites (one-time, before first deploy)

You (or your infra owner) need accounts for:

1. **A Next.js-friendly host** — Vercel is the reference (zero-config for the
   App Router). A containerized deploy (Docker + Node 20 on ECS/Fly/Render) is
   equally supported; §11 covers the container path.
2. **Managed PostgreSQL** with a connection **pooler** and automated backups —
   e.g. Neon, Supabase, or AWS RDS/Aurora. You get two connection strings:
   a **pooled** URL (runtime) and a **direct** URL (migrations).
3. **S3-compatible object storage** for uploaded documents — AWS S3,
   Cloudflare R2, or Supabase Storage. The bucket must be **private**
   (no public read); access is via short-lived signed URLs only.
4. **A domain name** with DNS you control, and TLS (the host usually issues
   certificates automatically).
5. **A secret manager** — the host's built-in env/secret store is fine
   (Vercel Project Env Vars, or AWS Secrets Manager for containers).

Tooling: **Node 20 LTS**, `git`, and the ability to run `npx prisma …`.

---

## 3. Environment variables (validated at boot by `lib/security/env.ts`)

The app **refuses to boot** if a required variable is missing or malformed —
this is a deliberate security control (`SECURITY_CHECKLIST.md` §5). The
canonical template is [`.env.example`](../.env.example).

### 3.1 Required in every environment

```
# Database — from your managed Postgres provider
DATABASE_URL=            # POOLED connection string (runtime queries)
DIRECT_URL=              # DIRECT connection string (migrations only)

# Auth (Auth.js / NextAuth)
NEXTAUTH_URL=            # canonical app URL, e.g. https://app.healthpassport.example
NEXTAUTH_SECRET=         # long random secret — generate with: openssl rand -base64 32
```

`AUTH_SECRET`/`AUTH_URL` are accepted as aliases for
`NEXTAUTH_SECRET`/`NEXTAUTH_URL` (see `lib/security/env.ts`). In containerized
deploys behind a proxy, also set `AUTH_TRUST_HOST=true`.

### 3.2 Required once object storage is live (documents module)

```
STORAGE_ENDPOINT=        # S3-compatible endpoint URL
STORAGE_BUCKET=          # private bucket name
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
```

### 3.3 Optional (turn on at scale)

```
REDIS_URL=               # central rate limiter for horizontal scale (SECURITY §8)
```

### 3.4 Rules

- **Secrets go in the host secret store only** — never in git, never in a
  `NEXT_PUBLIC_*` variable (those reach the browser). `.env`, `.env*.local`,
  and `.env.production` are git-ignored.
- Use a **different `NEXTAUTH_SECRET` per environment**. Rotating it logs
  everyone out (JWT sessions), so rotate deliberately.
- Give the **runtime** DB user least privilege (DML only). Migrations use the
  **direct** URL with a higher-privilege user; keep them separate where the
  provider allows.

---

## 4. Database migrations

Prisma migrations are the **only** way the schema changes. They are committed
to git (`prisma/migrations/`) and applied identically in every environment —
no hand-editing production tables.

- **Development** — `npx prisma migrate dev`
  *Creates a new migration from your schema changes and applies it locally.*
- **Staging / Production** — `npx prisma migrate deploy`
  *Applies only the already-committed migrations, in order. No prompts, no
  schema drift, no accidental data loss. Run this as a **release step, before**
  the new app version starts serving traffic.*
- **Reference/seed data** — `npx prisma db seed` (synthetic only; never real PHI).

Migrations are **forward-only**. To undo a bad change, write a new corrective
migration — never destructively roll a migration back on a database holding PHI
(§9).

---

## 5. First production deploy (step by step)

### On Vercel (reference path)

1. **Import the repo** into Vercel. Set the **Root Directory** to
   `healthpassport-pro` (the app is nested in a larger repo).
2. **Add environment variables** (§3) to the Production environment in Project
   Settings → Environment Variables. Generate the secret with
   `openssl rand -base64 32`.
3. **Provision the database and storage** (§2) and paste their connection
   strings/keys into the env vars.
4. **Apply migrations against production** *before* the first serve. From a
   trusted machine with the production `DIRECT_URL` exported:
   ```
   cd healthpassport-pro
   npx prisma migrate deploy
   ```
5. **Deploy.** Vercel runs `npm run build` (which runs `prisma generate` first,
   per `package.json`). Security headers (CSP, HSTS, etc.) are emitted by
   `next.config.mjs` on every route — no edge config needed.
6. **Smoke-test** (§8.3) on the production URL, then announce go-live.

Subsequent deploys: push to the release branch → Vercel builds and deploys →
run `migrate deploy` as part of the release if the push contains new migrations.

---

## 6. CI/CD pipeline

The pipeline is defined in
[`.github/workflows/healthpassport-pro-ci.yml`](../../.github/workflows/healthpassport-pro-ci.yml)
and runs on every push and PR that touches `healthpassport-pro/`.

**`verify` job** (gate for every change):
`npm ci` → `npm audit --audit-level=high` (fails on high/critical) →
`npm run typecheck` → `npm run lint` → `npm test` (Vitest unit suite) →
`npm run build`.

**`e2e` job** (Playwright + `@axe-core/playwright` against a real Postgres 16
service): `prisma migrate deploy` → install Chromium → build → `npm run e2e`,
uploading the Playwright report as an artifact.

**Recommended promotion flow** (wire to your host):
- On merge to the integration branch → deploy to **staging**, run E2E + axe.
- On release to the production branch → run `prisma migrate deploy` against
  production, deploy, then run the smoke test (§8.3).
- Green CI is a **merge gate**. A failed `npm audit`, type error, lint error,
  failed test, or failed build blocks the deploy.

---

## 7. Security at deploy

Cross-reference: [`SECURITY_CHECKLIST.md`](SECURITY_CHECKLIST.md).

- **HTTPS + HSTS everywhere.** HSTS is set by `next.config.mjs`
  (`max-age=63072000; includeSubDomains; preload`). Ensure the domain is only
  ever served over TLS before enabling `preload`.
- **Security headers** (CSP, `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options: DENY`, COOP, `Permissions-Policy`) ship from the app; verify
  them post-deploy with `curl -sI https://<domain>`.
- **Secrets** live only in the host secret store; rotate on staff offboarding.
- **Least-privilege credentials** — separate migration vs. runtime DB users;
  storage keys scoped to the one private bucket.
- **Backups encrypted at rest**; restore tested (§8.2).
- **Tracked hardening follow-ups** (documented, not launch-blocking): nonce-based
  CSP to drop `'unsafe-inline'`, MFA/WebAuthn step-up, breached-password check,
  upload malware scanning, centralized Redis rate limiting, and a pre-launch
  penetration test. Track these on the security backlog.

---

## 8. Backups, disaster recovery & smoke tests

### 8.1 Backups
- **Database**: automated daily backups **plus** point-in-time recovery (PITR)
  where the provider supports it. Encrypted at rest.
- **Object storage**: enable bucket **versioning** and a lifecycle policy so a
  deleted/overwritten document can be recovered.

### 8.2 Disaster recovery
- Define and record **RPO** (max acceptable data loss) and **RTO** (max
  acceptable downtime) before launch.
- Keep a written **restore runbook**: restore the latest DB snapshot to a new
  instance → point `DATABASE_URL`/`DIRECT_URL` at it → run `prisma migrate deploy`
  (no-op if current) → smoke-test → cut traffic over.
- **Test the restore periodically** (at least before launch and quarterly). An
  untested backup is not a backup.

### 8.3 Post-deploy smoke test (do every production deploy)
1. Load the marketing/login page over HTTPS; confirm the security headers via
   `curl -sI`.
2. Register a **synthetic** test account, complete onboarding, add a vital that
   trips a red-flag rule, and confirm the safety alert + disclaimer render.
3. Upload a small test document, confirm it stores and downloads via signed URL,
   then soft-delete it.
4. Generate and print/export a doctor report.
5. Confirm `/api/*` responses are **not** cached by the service worker and no PHI
   appears in logs. Remove the synthetic account afterward.

---

## 9. Rollback

- Deploys are **versioned and immutable**. Roll back application code by
  re-pointing to the previous build (Vercel "Promote previous deployment", or
  redeploy the prior image tag).
- **Migrations are forward-only and are *not* rolled back destructively.** If a
  migration caused a problem, ship a **new corrective migration**. Rolling a
  schema change backward on a PHI database risks data loss.
- If a rollback would leave app code and schema incompatible, prefer rolling
  **forward** with a fix. Keep migrations backward-compatible (expand-then-
  contract) so the previous app version can still run against the new schema
  during a rollback window.

---

## 10. Monitoring & observability

- **Uptime + health checks** on the app URL.
- **Error tracking** (e.g. Sentry) with **PHI scrubbing** on — never send
  request bodies or clinical values to a third-party tracker.
- **Structured application logs**, PHI-scrubbed, no secrets (`SECURITY §9`).
- **Database** slow-query and capacity/connection-pool metrics.
- **Audit logging is separate from ops logging**: `AuditLog` records
  `CREATE/UPDATE/DELETE/EXPORT/LOGIN/CONSENT_CHANGE` with actor/entity/timestamp
  and **metadata only, never PHI values** (`SECURITY §7`). Retain audit logs per
  your compliance policy; do not ship them to general ops log sinks.

---

## 11. Containerized deploy (alternative to Vercel)

If not using Vercel:

1. Build a Node 20 image that runs `npm ci && npm run build`, then
   `npm run start` (Next serves on `PORT`, default 3000).
2. Inject all §3 env vars from the orchestrator's secret store; set
   `AUTH_TRUST_HOST=true` when behind a load balancer/proxy.
3. Terminate TLS at the load balancer **and** keep HSTS on; forward
   `X-Forwarded-Proto` so the app knows it is on HTTPS.
4. Run `npx prisma migrate deploy` as a **release/init step** (a separate job or
   init container) that completes **before** app containers accept traffic —
   never concurrently across replicas.
5. Mount object storage via the S3-compatible keys (§3.2); do **not** use local
   disk storage in production (it isn't shared across replicas and isn't backed
   up).
6. Add a container **health check** hitting the app root; wire it to the
   orchestrator's readiness/liveness probes.

---

## 12. Scaling notes

See [`SCALABILITY_PLAN.md`](SCALABILITY_PLAN.md) for the full plan. At deploy time:

- Use the **pooled** `DATABASE_URL` for the app and reserve `DIRECT_URL` for
  migrations — serverless/edge runtimes exhaust unpooled connections fast.
- Switch rate limiting to the **central Redis** limiter (`REDIS_URL`) once you
  run more than one app instance; the in-process limiter does not coordinate
  across replicas.
- Serve static assets via the host CDN; **never** cache PHI or `/api/*` at the
  edge.

---

## 13. Go-live checklist (pre-production sign-off)

- ☐ Security review + penetration test complete ([`SECURITY_CHECKLIST.md`](SECURITY_CHECKLIST.md)).
- ☐ Privacy review / DPIA complete ([`PRIVACY_MODEL.md`](PRIVACY_MODEL.md)); consent capture + export + erasure verified.
- ☐ Clinical Safety Officer sign-off on red-flag rules + educational content ([`MEDICAL_SAFETY_RULES.md`](MEDICAL_SAFETY_RULES.md), [`CLINICAL_REFERENCE.md`](CLINICAL_REFERENCE.md)).
- ☐ Accessibility audit passed — automated + manual ([`ACCESSIBILITY_CHECKLIST.md`](ACCESSIBILITY_CHECKLIST.md)).
- ☐ All required env vars set in the production secret store; app boots (env validation passes).
- ☐ Production migrations applied (`prisma migrate deploy`); seed reference data loaded (no real PHI).
- ☐ Backups enabled (DB PITR + storage versioning); **restore tested**; RPO/RTO recorded.
- ☐ Monitoring, error tracking (PHI-scrubbed), and health checks live.
- ☐ Security headers verified over HTTPS (`curl -sI`); HSTS confirmed before `preload`.
- ☐ Smoke test (§8.3) passed on the production URL with a synthetic account, then account removed.
- ☐ Legal pages published (privacy, terms, medical disclaimer); consent versions aligned.
- ☐ Rollback path rehearsed; on-call owner and escalation path documented.
