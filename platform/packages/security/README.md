# `@diabetes-quest/security`

Security & compliance primitives (Vol 8). **Pure** — crypto and keyed-hash primitives
are injected, so the package has no runtime dependencies and is fully unit-testable
(8 tests, incl. real AES-256-GCM wired in via `node:crypto`).

| Module | Provides | Spec |
|--------|----------|------|
| `redaction` | `redact` deep-masks sensitive keys + emails/JWTs in strings — "no PHI in logs" | Vol 8 §logging |
| `classification` | `classifyField` → C1–C4; `requiresEncryptionAtRest` | Vol 8 §data classification |
| `crypto` | `EncryptedField` envelope, `KeyRing`, `encryptField`/`decryptField` — rotation-safe (decrypts old-key data), AEAD injected | Vol 8 §encryption / key mgmt |
| `pseudonymize` | `pseudonym`/`deidentify` via an injected HMAC hasher | Vol 8 §privacy-by-design |
| `dsar` | `buildExport` (GDPR Art. 15/20) + `planErasure` (Art. 17 — delete PII, retain pseudonymized audit) | Vol 8 §DSAR |
| `headers` | `securityHeaders` (HSTS, nosniff, CSP, …) | Vol 8 / OWASP |

The production crypto wiring (real AES-256-GCM, SHA-256 audit hash, HMAC pseudonym
hasher) lives in [`services/backend/src/infra/crypto.ts`](../../services/backend/src/infra/crypto.ts)
and is injected into these pure functions. The backend server applies `securityHeaders`
to every response.

```bash
npm test -w @diabetes-quest/security
```

**Still TODO:** apply field encryption to PHI columns in the Postgres repositories, swap
the core audit chain to `sha256Hex`, and add per-route rate limiting.
