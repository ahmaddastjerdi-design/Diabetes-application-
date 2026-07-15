# HealthPassport Pro — Security Checklist (OWASP ASVS-inspired)

Status: Phase 0 · Owner: Security Engineer

This is the binding security checklist for V1. Items are marked
**[MUST]** (required for launch) or **[PLAN]** (designed now, implemented in the
noted phase). It handles **PHI**; security is a requirement, not a feature.

Legend: ☐ not started · ◐ in progress · ☑ done (updated as phases land).

---

## 1. Authentication & session
- ☐ **[MUST]** NextAuth with secure credential handling; passwords hashed with a
  strong adaptive algorithm (argon2id or bcrypt, high cost).
- ☐ **[MUST]** Session cookies: `httpOnly`, `secure`, `sameSite=lax/strict`,
  short lifetime + rotation.
- ☐ **[MUST]** Generic auth errors ("invalid email or password") — no user
  enumeration.
- ☐ **[MUST]** Password policy (length-first), breached-password check **[PLAN]**.
- ☐ **[MUST]** Rate limiting + lockout/backoff on login and forgot-password.
- ☐ **[PLAN]** MFA / WebAuthn step-up (later phase).

## 2. Authorization & data isolation
- ☐ **[MUST]** Every clinical query is scoped to the session `userId`; a helper
  in `lib/db` forbids unscoped access to owned tables.
- ☐ **[MUST]** Server-side authorization on **every** mutation and read; the
  client is never trusted for access decisions.
- ☐ **[MUST]** No IDOR: object access verifies ownership before returning data.
- ☐ **[PLAN]** Role-based checks scaffolded for future caregiver/physician roles.

## 3. Input validation & output encoding
- ☐ **[MUST]** Zod schemas validate all input server-side (shared with client).
- ☐ **[MUST]** React escapes output by default; no `dangerouslySetInnerHTML` on
  user/clinical content.
- ☐ **[MUST]** Parameterized queries via Prisma (no raw string SQL with input).

## 4. File upload security (documents)
- ☐ **[MUST]** Validate MIME type + extension + magic bytes; allowlist
  (pdf, jp/png, common docs); enforce max size.
- ☐ **[MUST]** Store in object storage, **not** web root; random object keys;
  never execute uploaded content.
- ☐ **[MUST]** Store `checksumSha256`; serve via short-lived signed URLs.
- ☐ **[PLAN]** Malware scanning hook before finalizing an upload.

## 5. Secrets & configuration
- ☐ **[MUST]** No secrets in the client bundle; only `NEXT_PUBLIC_*`
  (non-secret) reach the browser.
- ☐ **[MUST]** Env validated at boot with Zod (`lib/security/env.ts`); app
  refuses to start on missing/invalid config.
- ☐ **[MUST]** `.env` git-ignored; `.env.example` documents required vars.

## 6. Transport & headers
- ☐ **[MUST]** HTTPS only; HSTS.
- ☐ **[MUST]** Security headers: CSP, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, frame-ancestors `none`.
- ☐ **[MUST]** CSRF protection for cookie-based mutations (NextAuth + same-site;
  double-submit/anti-CSRF for custom route handlers).

## 7. Audit logging
- ☐ **[MUST]** `AuditLog` records sensitive `CREATE/UPDATE/DELETE/EXPORT`,
  plus `LOGIN/LOGOUT/CONSENT_CHANGE`, with actor, entity, timestamp, IP/UA.
- ☐ **[MUST]** Audit entries never contain PHI **values** (metadata only).
- ☐ **[PLAN]** Tamper-evident hash chaining (ported from prototype).

## 8. Rate limiting & abuse
- ☐ **[MUST]** Rate limit auth, upload, and export endpoints (per-IP + per-user).
- ☐ **[PLAN]** Central limiter (e.g. Upstash/Redis) for horizontal scale.

## 9. Error handling & logging
- ☐ **[MUST]** No stack traces / internal details / PII to the client.
- ☐ **[MUST]** Server logs are PHI-scrubbed; structured; no secrets.

## 10. Dependencies & supply chain
- ☐ **[MUST]** `npm audit` in CI fails on high/critical.
- ☐ **[MUST]** Pinned/lockfiled deps; minimal surface; reviewed on add.

## 11. Privacy controls (cross-ref)
- ☐ **[MUST]** Consent capture + versioning; data export; data erasure.
  See [`PRIVACY_MODEL.md`](PRIVACY_MODEL.md).

## 12. Testing & verification
- ☐ **[MUST]** Auth, authorization (ownership/IDOR), and validation covered by
  automated tests (see [`QA_TEST_PLAN.md`](QA_TEST_PLAN.md)).
- ☐ **[PLAN]** Pre-launch penetration test + dependency/security review.

---

### ASVS mapping (summary)
V1 targets **ASVS Level 2** thinking for a PHI-handling app: strong auth (V2),
session management (V3), access control (V4), validation/encoding (V5),
stored-secret handling (V6), error/logging (V7), data protection & privacy (V8/V9),
and configuration (V14). Level attainment is verified pre-launch.

---

## Implementation status (as of Phase 10)

**Implemented**
- Auth: Auth.js credentials, bcrypt (cost 12), JWT sessions, httpOnly/sameSite
  cookies, generic auth errors, idle behavior; **rate limiting on uploads**.
- Authorization: every data-layer function is `userId`-scoped; ownership-scoped
  `updateMany` for deletes (IDOR-blocked, proven by tests); middleware +
  server-side `requireUser()`.
- Validation: Zod on every server action + route; **magic-byte file validation**
  with allowlist + size cap + content/extension-mismatch rejection.
- Secrets/config: `.env` git-ignored, `.env.example` provided, Zod env validation
  at startup (skipped only during build).
- Headers: **CSP**, HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options`, COOP, Permissions-Policy (next.config).
- Audit: `AuditLog` for CREATE/UPDATE/DELETE/EXPORT/LOGIN/CONSENT_CHANGE.
- Supply chain: `npm audit --audit-level=high` gates CI.
- Storage: documents stored outside the web root; DB holds metadata only;
  download is auth + ownership gated.
- Service worker never caches `/api/*` or PHI.

**Tracked follow-ups (documented, not yet implemented)**
- **Nonce-based CSP** — script-src currently allows `'unsafe-inline'` for Next's
  bootstrap; upgrade to per-request nonces via middleware (§6).
- MFA/WebAuthn step-up; breached-password check; malware scan of uploads;
  centralized (Redis) rate limiting; pre-launch penetration test.
