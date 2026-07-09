# HealthPassport Pro — Security & Privacy

Status: living document · Owners: Security Engineer, Clinical Safety Officer

HealthPassport Pro handles **Protected Health Information (PHI)**. Security and
privacy are product requirements, not features. This document is the source of
truth for the threat model, the data-protection design, and the operational
policies that the code must uphold.

---

## 1. Data classification

| Class | Examples | Handling |
|-------|----------|----------|
| **PHI (highest)** | Name, DOB, conditions, medications, readings, symptoms, reports | Encrypted at rest; never sent to third parties; never in logs/analytics |
| **Sensitive config** | Passphrase-derived key material, consent grants | In-memory only where possible; key never persisted in plaintext |
| **Non-sensitive** | UI theme, language, reduced-motion preference | Plain local storage acceptable |

**Rule:** if a value is PHI, it lives only inside the encrypted store or in
memory during an unlocked session. It never enters `localStorage` in plaintext,
never enters console logs, never leaves the device in Phase 1.

---

## 2. Phase 1 threat model (local-first PWA)

Assets: the patient's PHI on the device; the integrity of educational/analytic
output; the integrity of the app code (service worker).

| Threat | Mitigation |
|--------|------------|
| Device theft / shared device | PHI encrypted with AES-GCM under a key derived from the user's passphrase (PBKDF2, high iteration count). Locking clears keys from memory. No passphrase → no plaintext. |
| Casual local inspection (DevTools/IndexedDB) | Records are ciphertext at rest; the plaintext model only exists in memory while unlocked. |
| XSS exfiltrating PHI | Strict Content-Security-Policy; no `dangerouslySetInnerHTML` on user/clinical content; no third-party script origins; dependencies minimized and pinned. |
| Malicious/again-tampered service worker | Served same-origin over HTTPS only; SW scope limited; SRI/pinned build; no remote code eval. |
| Supply-chain (dependency) | Minimal dependency surface, pinned versions, `npm audit` in CI, no postinstall scripts from app deps where avoidable. |
| Weak passphrase / brute force | PBKDF2 with high iterations makes offline guessing costly; UI enforces a minimum passphrase strength; optional WebAuthn unlock in a later phase. |
| Accidental PHI in logs/telemetry | No telemetry in Phase 1. A PHI-scrubbing rule is mandated for any future logging. |

Out of scope for Phase 1 (introduced with the backend): server-side auth,
transport of PHI, multi-user consent enforcement, DDoS — covered in §6.

---

## 3. Encryption design (at rest)

- **Cipher**: AES-GCM, 256-bit, random 96-bit IV per record (never reused).
- **Key derivation**: PBKDF2-HMAC-SHA-256 over the user passphrase with a random
  per-install salt and a high iteration count (≥310,000, OWASP-aligned; tuned
  against device performance).
- **Key lifecycle**: the derived key is held only in memory (a non-extractable
  `CryptoKey` where the platform allows) for the duration of an unlocked
  session. Lock / timeout / tab-close discards it. It is **never** written to
  disk.
- **Record layout**: each stored record is `{ iv, ciphertext, aad }` where AAD
  binds the record id and type so ciphertext can't be swapped between records.
- **Verification / unlock**: a small known-plaintext "verifier" record proves a
  passphrase is correct without storing the passphrase or key.
- **Recovery**: because the key is passphrase-derived and never escrowed in
  Phase 1, a forgotten passphrase means data cannot be decrypted — this is
  communicated clearly at setup, and export/backup is offered. Escrowed
  recovery (with explicit consent) is a backend-phase feature.

All crypto uses the platform **Web Crypto API**. We write no bespoke
cryptographic primitives.

---

## 4. Consent & privacy

- **Data minimization**: collect only what the PHR needs; every field has a
  purpose.
- **Purpose limitation**: PHI is used only to render the patient's own record,
  produce their reports, and drive their care features. No secondary use.
- **No third-party trackers**: analytics/ad/tracking scripts are prohibited from
  ever touching PHI; Phase 1 ships none at all.
- **Explicit consent** is required before any future sharing (physician access,
  cloud sync, research). Consent is granular, revocable, time-boxed, and
  audited. It is modeled as a first-class record (FHIR `Consent`) so it exports
  and travels with the patient.
- **Right to access / portability / erasure** (GDPR Art. 15/20/17): the patient
  can export their full record (FHIR Bundle + human-readable) and can erase all
  local data at any time from within the app.

---

## 5. Secure-development practices

- TypeScript `strict`; no `any` on clinical paths.
- Dependencies: minimal, pinned, audited in CI (`npm audit`), reviewed on add.
- No secrets in the repo; none needed in Phase 1 (no backend).
- Content-Security-Policy and security headers documented for the hosting layer.
- Code review required; security-sensitive changes (crypto, storage, safety
  engine) require a second reviewer.
- Automated tests cover the crypto round-trip, tamper-rejection (AAD/GCM), and
  lock/clear behavior.

---

## 6. Backend-phase security (designed, not yet built)

When the cloud is introduced (see [`ROADMAP.md`](ROADMAP.md)):

- **Transport**: TLS 1.2+ only; HSTS; certificate pinning for the mobile shell.
- **Identity**: OIDC; separate patient/physician realms; WebAuthn step-up for
  sensitive actions; short-lived tokens.
- **Authorization**: RBAC + consent-scoped ABAC; a physician can read a record
  only within an active, patient-granted, audited consent.
- **Encryption in transit and at rest**: server-side envelope encryption; keys
  in a managed KMS/HSM; per-region data residency.
- **Audit**: append-only (WORM) log of every PHI access — who, what, when, why —
  retained per regulation.
- **Compliance posture**: designed toward **HIPAA** (US) and **GDPR** (EU)
  controls; specific certification (e.g. SOC 2, ISO 27001, HITRUST) is a
  business milestone tracked in the roadmap.
- **Incident response**: documented severity levels, on-call, breach
  notification timelines (GDPR 72h), and a post-incident review process.

---

## 7. Responsible disclosure

A `SECURITY.md` contact and disclosure policy will be published with the first
public release. Security reports are triaged ahead of feature work.
