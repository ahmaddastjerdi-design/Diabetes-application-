# Diabetes Quest — Volume 8: Security & Compliance

_Part of the Diabetes Quest Specification Suite — Volume 8 of 10._

**Abstract.** This volume specifies the security and compliance posture for the **full Diabetes Quest platform** — the Android patient app, the backend, the clinician web panel, the medical-device ingestion layer, and the AI Health Coach — across the transition from today's local-only prototype (all state in unencrypted device `AsyncStorage`, **no PII leaving the device**, per `DESIGN.md` §5) to a synced, FHIR-backed backend that processes **Protected Health Information (PHI)**. It defines security objectives and the PHI/PII data classification; the regulatory landscape (HIPAA Privacy/Security/Breach rules and BAAs, GDPR lawful basis / data-subject rights / DPIA, ISO 27001 alignment, and medical-device regulatory awareness for the educational-to-clinical transition); a mapping of platform controls to **OWASP MASVS** and the **OWASP Mobile Top 10**; authentication and authorization (OAuth2/OIDC, MFA, RBAC + consent); encryption in transit and at rest with key management; mobile-app hardening (including the explicit migration off plaintext `AsyncStorage`); FHIR / SMART-on-FHIR security; immutable audit logging; a STRIDE-based threat model for the key data flows; privacy-by-design and data-subject request handling; vulnerability management (SAST/DAST/SCA/SBOM, pen-test cadence, responsible disclosure); incident response and breach notification; and AI-specific security. All requirements carry stable IDs (`SEC-NNN`) with acceptance criteria, and the volume closes with a security controls checklist and full cross-references.

> **Scope note — educational today, regulated tomorrow.** The product is **educational only** at the time of writing and is **not** a medical device. The controls in this volume are the engineering target for the synced, PHI-handling platform on the Volume 1 roadmap. Items that apply *only once PHI leaves the device* are flagged accordingly. Nothing here is legal advice; regulatory determinations must be confirmed with qualified counsel and a Data Protection Officer.

---

## Table of contents

1. [Security objectives & data classification](#1-security-objectives--data-classification)
2. [Regulatory landscape](#2-regulatory-landscape)
3. [OWASP MASVS & Mobile Top 10 mapping](#3-owasp-masvs--mobile-top-10-mapping)
4. [Authentication & authorization](#4-authentication--authorization)
5. [Encryption & key management](#5-encryption--key-management)
6. [Mobile application hardening](#6-mobile-application-hardening)
7. [FHIR & SMART-on-FHIR security](#7-fhir--smart-on-fhir-security)
8. [Audit logging](#8-audit-logging)
9. [Threat model (STRIDE)](#9-threat-model-stride)
10. [Privacy by design](#10-privacy-by-design)
11. [Vulnerability management](#11-vulnerability-management)
12. [Incident response & breach notification](#12-incident-response--breach-notification)
13. [AI-specific security](#13-ai-specific-security)
14. [Compliance requirements (SEC-IDs)](#14-compliance-requirements-sec-ids)
15. [Security controls checklist](#15-security-controls-checklist)
16. [Traceability & cross-references](#16-traceability--cross-references)

---

## 1. Security objectives & data classification

### 1.1 Security objectives

The platform's security program serves five objectives, in priority order:

1. **Protect patient safety.** Security failures (e.g. a tampered AI coach response, a corrupted device reading, or an account takeover) can lead to harmful self-management decisions. Patient safety is the apex objective and overrides convenience.
2. **Protect confidentiality of PHI/PII.** Health data is sensitive and, once synced, regulated. Confidentiality is enforced by default-deny access, encryption, and consent.
3. **Preserve integrity of clinical data.** Observations, medication logs, and audit records must be accurate and tamper-evident; a falsified glucose history is a clinical hazard.
4. **Maintain availability** of the patient app and clinician panel commensurate with their (non-emergency, non-life-critical) role — the product is explicitly **not** an emergency or alerting system.
5. **Demonstrate compliance & accountability** — every access to PHI is attributable and auditable (HIPAA, GDPR, ISO 27001).

These map to the CIA triad plus **accountability** (audit) and **safety**, and trace to Volume 1 business goal **BG-005** (operate to clinical-grade security and compliance).

### 1.2 The local-only baseline and what changes

| Aspect | Today (prototype) | Target (synced platform) |
|--------|-------------------|--------------------------|
| Data location | On-device only, `AsyncStorage` | On-device cache + backend (Volume 4) |
| PII/PHI egress | **None** — nothing leaves the device | PHI synced over the network to a HIPAA-scoped backend |
| Storage protection | **Plaintext** `AsyncStorage` (not encrypted) | Encrypted local storage + encrypted backend stores |
| Identity | None (anonymous local profile) | OAuth2/OIDC accounts, MFA for clinicians |
| Regulatory regime | Consumer software, educational | HIPAA + GDPR + ISO 27001, BAAs in place |

The single most important security consequence of the roadmap is that **the threat model changes the moment the first byte of PHI leaves the device.** Until then, the dominant risks are local-device risks (lost/stolen phone, malicious app on a rooted device). After sync, the full server-side, network, and multi-tenant threat surface applies. This volume specifies the target state and flags pre-sync vs. post-sync applicability.

### 1.3 Data classification & PHI/PII definition

All data is classified into four tiers. Controls are applied per tier; **PHI** is the union of health data with an individual identifier.

| Class | Definition | Examples in Diabetes Quest | Handling |
|-------|------------|----------------------------|----------|
| **C4 — PHI / Special-category** | Health data linked to an identifiable person (HIPAA PHI; GDPR Art. 9 special category) | Glucose / BP / weight observations, medication logs, condition type (T1/T2), CGM streams, clinician notes, AI-coach conversation transcripts that reference health | Strongest: encryption in transit + at rest, RBAC + consent, full audit, minimization, BAA-covered processors only |
| **C3 — PII (non-health)** | Identifies a person but is not health data | Name, email (`amirfreq22@gmail.com`-class data), phone, device IDs, IP, push tokens, clinician credentials | Encryption, access control, audit on access |
| **C2 — Pseudonymized / de-identified** | Re-identification requires a key the data store does not hold | Analytics events keyed by a rotating pseudonymous ID; de-identified research extracts | Restricted; key segregation; no re-linkage without authorization |
| **C1 — Public / non-sensitive** | No personal data | Lesson content, app version, marketing copy, public docs | Standard integrity controls |

**The 18 HIPAA identifiers** (names, geographic subdivisions smaller than a state, dates more specific than year, phone/fax, email, SSN, MRN, device identifiers/serial numbers, IP addresses, biometric identifiers, full-face photos, account numbers, etc.) are treated as identifiers for de-identification (§10.4). A device serial number from a CGM/BGM (Volume 5) is itself a HIPAA identifier and is C4 when bound to a patient.

**Explicit C4 callout — AI transcripts.** Conversations with the AI Health Coach (Volume 6) routinely contain health context and are **PHI**. They are not "just logs"; they receive C4 handling end-to-end.

---

## 2. Regulatory landscape

### 2.1 HIPAA (US)

Diabetes Quest, once it stores or transmits PHI on behalf of (or in partnership with) covered entities such as clinics, operates as a **Business Associate** and may itself be a covered entity for direct-to-consumer health data. The three operative rules:

- **Privacy Rule.** Governs *uses and disclosures* of PHI. Implemented via minimum-necessary access (RBAC, §4.4), patient consent and authorization (§10.5), and a documented Notice of Privacy Practices. PHI is used only for the purposes the patient consented to (self-management, clinician care, and — only if separately consented — research/analytics).
- **Security Rule.** Mandates administrative, physical, and technical safeguards for ePHI. The technical safeguards map directly to this volume: access control (§4), audit controls (§8), integrity (§5, §8), person/entity authentication (§4), and transmission security (§5.1). Administrative safeguards (risk analysis, workforce training, sanction policy) and physical safeguards (data-center controls, inherited from the cloud provider's BAA) are organizational requirements referenced here and owned by the security program.
- **Breach Notification Rule.** Requires notification of affected individuals **without unreasonable delay and no later than 60 days** after discovery of a breach of unsecured PHI, plus HHS and (for breaches ≥500 individuals) media notification. See §12.

**Business Associate Agreements (BAAs).** Every third party that creates, receives, maintains, or transmits PHI on the platform's behalf — cloud provider, managed database, object storage, email/SMS/push vendor, error-monitoring service, **and the LLM provider for the AI coach** — must have a signed BAA *before* any PHI flows to it. A vendor without a BAA must not receive C3/C4 data; this is enforced as a release gate (`SEC-031`). **Encryption of PHI to NIST-specified standards renders it "unsecured PHI" no longer**, providing breach-notification *safe harbor* — a key reason §5's encryption requirements are mandatory rather than best-effort.

### 2.2 GDPR (EU/EEA/UK-GDPR)

Health data is **Article 9 special-category data**; processing is prohibited unless a §9(2) condition applies.

- **Lawful basis (Art. 6) + Art. 9 condition.** The primary basis for processing patient health data is **explicit consent** (Art. 6(1)(a) + Art. 9(2)(a)), captured granularly at onboarding and per-purpose (self-management vs. clinician sharing vs. research). Where a clinic is the controller and provides care, Art. 9(2)(h) (provision of health care) may apply; the controller/processor split is documented per deployment. Security operations rely on **legitimate interests** (Art. 6(1)(f)) only for strictly non-health operational data (e.g. fraud/abuse prevention on auth).
- **Data-subject rights.** Access (Art. 15), rectification (16), erasure / "right to be forgotten" (17), restriction (18), **data portability** (20), and objection (21). The platform implements machine-actionable export and delete (§10.6, `SEC-026`).
- **DPIA (Art. 35).** Large-scale processing of special-category data **requires** a Data Protection Impact Assessment. A DPIA is a release gate before the first production PHI sync and is revisited whenever a new high-risk processing activity is added (new device type, AI model change, new analytics pipeline). The DPIA references this volume's threat model (§9) and data-flow diagrams.
- **Data residency & transfers.** EU patient data is stored in-region; international transfers use Standard Contractual Clauses or an adequacy decision. Pseudonymization (Art. 4(5)) and data minimization (Art. 5(1)(c)) are built into the schema (Volume 4).
- **Roles.** Where the platform decides purposes/means it is a **controller**; where it processes on a clinic's instructions it is a **processor** under an Art. 28 Data Processing Agreement. A Data Protection Officer (or designated owner) is appointed.

### 2.3 ISO 27001 alignment

The security program is structured to be **ISO 27001-certifiable**, with an Information Security Management System (ISMS) covering scope definition, risk assessment/treatment, a Statement of Applicability against Annex A controls, and continual improvement. This volume's controls map to Annex A domains, notably: A.5 (policies), A.6 (organization / segregation of duties), A.8 (asset & access management — §1.3, §4), A.5.23 (cloud services), cryptography (§5), operations security & logging (§8, §11), supplier relationships (BAAs/DPAs, §2.1/§11), and incident management (§12). ISO 27701 extends the ISMS to a Privacy Information Management System covering §10.

### 2.4 Medical-device regulatory posture (awareness, not legal advice)

Today Diabetes Quest is **educational software** and makes **no diagnostic, treatment, or clinical claims**, placing it outside medical-device regulation. This boundary is a *product-defining constraint*, not an accident, and is enforced by the safety guardrails in Volumes 1 and 6.

**What changes if claims become clinical.** If the product begins to *diagnose, treat, mitigate, or make individualized clinical recommendations* (e.g. "your kidney function is declining — adjust your insulin"), it likely becomes **Software as a Medical Device (SaMD)**:

- **US (FDA).** SaMD classification (Class I/II/III) and a possible 510(k) or De Novo pathway; the FDA's risk-based framework and Good Machine Learning Practice apply, and AI/ML functions may require a Predetermined Change Control Plan. General-wellness and patient-education functions are typically outside FDA's enforcement focus — which is precisely why the product stays there today.
- **EU (MDR 2017/745).** Software with a medical purpose is a device; MDR Rule 11 tends to push diagnostic/decision-support software to **Class IIa or higher**, requiring a Notified Body, technical documentation, and clinical evaluation.

The **physiological simulation engine is a teaching model and must never be presented as predictive of an individual's real physiology** (Volume 1 guardrail). Any move toward clinical claims triggers a formal regulatory-strategy gate (`SEC-030`) *before* development, including a documented intended-use statement reviewed by regulatory counsel. The security controls in this volume (traceability, audit, change control, risk management) are *prerequisites* for any future SaMD submission, so building them now de-risks that transition.

---

## 3. OWASP MASVS & Mobile Top 10 mapping

The Android app is verified against the **OWASP Mobile Application Security Verification Standard (MASVS)** and tested against the **OWASP Mobile Top 10 (2024)**. Target verification level: **MASVS-L2** (defense-in-depth) for the PHI-handling release, with **MASVS-R** (resilience / reverse-engineering hardening) controls applied selectively where they protect anti-tampering and key material.

### 3.1 MASVS control-group mapping

| MASVS group | Intent | Diabetes Quest controls | Spec ref |
|-------------|--------|--------------------------|----------|
| **MASVS-STORAGE** | Secure local data storage | Migrate off plaintext `AsyncStorage` to encrypted store (EncryptedSharedPreferences / SQLCipher) with keys in Android Keystore; no PHI in caches/backups; `allowBackup=false` for PHI partitions | §6.1, SEC-010 |
| **MASVS-CRYPTO** | Correct cryptography | TLS 1.2+; AES-256-GCM at rest; keys from Keystore-backed hardware (StrongBox/TEE where available); no hard-coded keys; vetted libraries only | §5, SEC-008/009 |
| **MASVS-AUTH** | Authentication & authorization | OAuth2/OIDC + PKCE; biometric unlock of local session; MFA for clinicians; short-lived tokens; server-side authorization | §4 |
| **MASVS-NETWORK** | Secure networking | TLS everywhere, certificate pinning, no cleartext traffic (`cleartextTrafficPermitted=false`), HSTS at edge | §5.1, §6.2, SEC-011 |
| **MASVS-PLATFORM** | Safe platform interaction | Minimal exported components; secure IPC; screenshot/clipboard protections; safe deep-link & WebView handling; `FLAG_SECURE` on PHI screens | §6.5, SEC-014 |
| **MASVS-CODE** | Code & dependency quality | SCA + SBOM, pinned deps, input validation, no debug code in release, integrity of updates | §11, SEC-018/019 |
| **MASVS-RESILIENCE** | Anti-tampering / reverse-engineering | Root/jailbreak detection, anti-debug/anti-hook, Play Integrity attestation, RASP-style runtime checks, code obfuscation (R8) | §6.3, SEC-013 |
| **MASVS-PRIVACY** | User privacy | Data minimization, consent prompts, no PHI in third-party SDKs, prominent disclosure, no PHI in logs/analytics | §6.4, §10 |

### 3.2 OWASP Mobile Top 10 (2024) mapping

| Risk | Relevance to Diabetes Quest | Mitigation | Spec ref |
|------|-----------------------------|------------|----------|
| **M1 Improper Credential Usage** | Tokens for backend/FHIR; LLM API keys | No secrets in the app binary; tokens in Keystore-backed storage; key vault server-side | §5.4, §6.1 |
| **M2 Inadequate Supply Chain Security** | RN/Expo + many npm transitive deps | SBOM, SCA in CI, pinned/locked deps, signed builds, EAS build provenance | §11 |
| **M3 Insecure Authentication/Authorization** | Patient & clinician auth, RBAC | OIDC + PKCE, MFA for clinicians, server-side RBAC + consent checks | §4 |
| **M4 Insufficient Input/Output Validation** | Device payloads, FHIR, AI prompts | Schema validation on ingest, output encoding, prompt-injection defenses | §7, §13 |
| **M5 Insecure Communication** | Sync of PHI | TLS 1.2+, cert pinning, mTLS internal | §5.1, §6.2 |
| **M6 Inadequate Privacy Controls** | PHI + special-category data | Minimization, consent, de-identification, DSAR handling | §10 |
| **M7 Insufficient Binary Protections** | Theft of keys/logic via reversing | Obfuscation, anti-tamper, integrity attestation | §6.3 |
| **M8 Security Misconfiguration** | `allowBackup`, exported components, debug flags | Hardened manifest, release config lint, network-security-config | §6.5 |
| **M9 Insecure Data Storage** | **Current plaintext `AsyncStorage`** | Encrypted storage migration (the headline mobile fix) | §6.1, SEC-010 |
| **M10 Insufficient Cryptography** | At-rest & in-transit crypto | Strong, current algorithms; hardware-backed keys; rotation | §5 |

---

## 4. Authentication & authorization

Aligns with the backend identity model in **Volume 4**.

### 4.1 Identity & OAuth2/OIDC

- A central **OpenID Connect** identity provider issues identities for **patients** and **clinicians**. The platform uses standard **OAuth2** flows; the app obtains tokens via the **Authorization Code flow with PKCE** (the correct flow for a public mobile client — implicit flow is prohibited).
- The clinician web panel (Volume 3) uses Authorization Code + PKCE in a confidential or BFF (backend-for-frontend) configuration; client secrets never reside in browser code.
- Federated/SSO login for clinics (SAML/OIDC to a hospital IdP) is supported via the IdP, so clinic credentials are not duplicated.

### 4.2 Token handling

| Token | Lifetime | Storage | Notes |
|-------|----------|---------|-------|
| Access token (JWT) | Short (≤15 min) | In-memory on web; Keystore-backed secure store on device | Audience- and scope-scoped; validated server-side every request |
| Refresh token | Longer, rotating | Keystore/Keychain-backed secure storage; **rotation with reuse detection** | Revocable; reuse of a rotated token revokes the family |
| ID token | Session | Memory | Identity claims only; never used for authorization decisions |

- **No long-lived bearer tokens in plaintext storage.** Refresh-token rotation with automatic revocation on reuse mitigates token theft.
- All tokens are revocable centrally (logout-everywhere, on suspected compromise).

### 4.3 MFA & session management

- **MFA is mandatory for all clinician and administrative accounts** (TOTP authenticator or WebAuthn/passkey; SMS OTP permitted only as a fallback). Patient MFA is offered and encouraged but optional.
- **Session management:** idle timeout (clinician panel ≤15 min idle, absolute ≤8 h), re-authentication for sensitive actions (changing consent, exporting bulk PHI), device-bound sessions, and biometric/PIN re-unlock of the local app session after backgrounding.
- Failed-login throttling, account lockout with safe recovery, and anomaly detection (impossible travel, new-device) feed the audit log and IR process.

### 4.4 RBAC + consent-based access

Authorization is **default-deny** and evaluated **server-side on every request** (the client UI never grants access). Two layers combine:

1. **Role-Based Access Control (RBAC).** Roles align with Volume 4: `patient`, `clinician`, `clinic_admin`, `support`, `system`. Each role has a least-privilege permission set (e.g. `support` can never read clinical observation values).
2. **Consent / relationship-based access.** Even with the `clinician` role, a clinician may only access a *specific* patient's PHI if (a) an active care relationship exists **and** (b) the patient has granted consent for that clinic/clinician. Consent is scoped (which data categories, which time range, expiry) and revocable; revocation takes effect immediately. This implements HIPAA minimum-necessary and GDPR consent simultaneously.

Every authorization decision that grants access to PHI emits an audit event (§8). Break-glass emergency access (if ever introduced) is explicitly out of scope today (non-emergency product) and would require its own heavily-audited control.

---

## 5. Encryption & key management

### 5.1 In transit

- **All network communication uses TLS 1.2 or higher** (prefer TLS 1.3), with modern cipher suites only; legacy protocols (SSLv3, TLS 1.0/1.1) and weak ciphers are disabled. HSTS is enforced at the edge.
- **Cleartext traffic is forbidden** on the device (`cleartextTrafficPermitted="false"` in the Android network security config).
- **Internal service-to-service traffic uses mTLS** (mutual TLS) within the backend mesh (Volume 4), so services authenticate each other, not just clients.
- Certificate pinning protects the app↔backend channel (§6.2).

### 5.2 At rest

| Store | Encryption | Key custody |
|-------|------------|-------------|
| Backend primary DB (PHI) | AES-256 at rest (transparent DB encryption) + column/field-level encryption for the most sensitive C4 fields | KMS-managed keys, per-tenant data keys where feasible |
| Object storage (exports, attachments, CGM blobs) | AES-256 server-side encryption with KMS keys | KMS; bucket policies deny unencrypted writes |
| Backups & replicas | Encrypted with the same standard; tested restores | KMS; backups never less protected than primaries |
| Device local store | AES-256-GCM (SQLCipher / EncryptedSharedPreferences) | **Android Keystore** (hardware-backed / StrongBox where available); never exportable |
| Secrets / config | Encrypted secrets manager | KMS-backed vault, not in code or env files committed to git |

### 5.3 Key management & rotation

- A managed **KMS / HSM** holds root key material; data is protected with **envelope encryption** (data keys wrapped by KMS master keys).
- **Rotation:** master keys rotated on a defined schedule (≤12 months) and on suspected compromise; data keys rotated more frequently; TLS certs auto-rotated (≤90 days) via ACME; OIDC signing keys rotated with overlap. Rotation is automated and audited.
- **Key separation by purpose and tenant**; de-identification linkage keys (§10.4) are stored in a separate, more tightly-controlled key domain so that the analytics store cannot re-identify on its own.
- No human has standing access to plaintext root keys; key administration uses dual control and is audited.

### 5.4 Secrets management

- No secrets (API keys, DB creds, **LLM provider keys**, signing keys) in source control, app binaries, CI logs, or client-readable config. Secret scanning runs in CI and on push (`SEC-021`).
- Secrets are injected at runtime from a vault with short-lived, automatically-rotated credentials and least-privilege scoping. Build signing keys live in the EAS/Play signing infrastructure, not on developer machines.

---

## 6. Mobile application hardening

### 6.1 Secure local storage — the AsyncStorage migration

**Current state (must be fixed before any PHI is stored locally): `AsyncStorage` is unencrypted.** It writes plaintext to app-private storage, which is readable on rooted/compromised devices and may be swept into device backups. For the educational prototype that holds only non-PII game state this is acceptable; **the moment the local store holds any C3/C4 data it is not.**

**Migration path (`SEC-010`):**

1. Replace the `AsyncStorage` persistence in `GameContext` with an **encrypted store**: SQLCipher (for the structured observation/log cache) and/or EncryptedSharedPreferences for small key-value state.
2. **Encryption keys live in the Android Keystore** (hardware-backed/StrongBox when present), are non-exportable, and are unlocked by device credentials/biometrics for sensitive reads.
3. **Exclude PHI partitions from auto-backup** (`android:allowBackup="false"` or selective backup rules) so PHI is never written to cloud backups unencrypted.
4. **Local data minimization & TTL:** the device caches only what's needed for offline use, with a retention cap; on logout or consent revocation the encrypted store is wiped (crypto-shred the local key).
5. Migration is one-way and irreversible; on first run after upgrade, any existing plaintext store is migrated into the encrypted store and the plaintext copy securely deleted.

### 6.2 Certificate pinning

The app pins the backend's certificate/public-key (pin the leaf or intermediate SPKI, with a backup pin to survive rotation). Pinning failures abort the connection and are logged (without PHI). Pins are updatable via app release; a pin-rotation runbook prevents lockout.

### 6.3 Root/jailbreak detection, anti-tampering, attestation (MASVS-RESILIENCE)

- **Root/jailbreak detection** and **emulator/debugger detection**: on a compromised device the app degrades safely — it warns the user, and **blocks PHI sync** while allowing offline educational use. (Detection is a deterrent, not a guarantee; it is layered with server-side controls.)
- **Play Integrity / device attestation** verifies app and device integrity server-side before granting PHI access; failed attestation downgrades to educational-only mode.
- **Anti-tampering:** signature/checksum verification, R8 obfuscation + resource shrinking, anti-hooking (Frida/Xposed) checks, and removal of debug symbols from release builds.

### 6.4 Secure logging — no PHI in logs

- **No PHI, PII, tokens, or secrets in any log** (client, server, crash reports, analytics). This is an absolute rule (`SEC-016`).
- Logs use **structured events with stable identifiers, not values** (e.g. log "observation synced, type=glucose, id=…" — never the value 142 mg/dL bound to a name). A redaction/allowlist layer scrubs payloads before they reach any log sink; crash reporters are configured to strip user data.
- Third-party analytics/crash SDKs are **BAA-covered or receive only C1/C2 data**; PHI is never sent to non-BAA SDKs.

### 6.5 Platform protections (screenshots, clipboard, IPC)

- **`FLAG_SECURE`** on screens showing PHI prevents screenshots and exclusion from the recents thumbnail; sensitive screens blur on background.
- **Clipboard hygiene:** copying sensitive fields is restricted/auto-cleared; the keyboard is set to no-suggestion/no-learning on sensitive inputs.
- **Minimal attack surface:** no unnecessary exported activities/services/receivers/providers; deep links validated; WebViews (if any) sandboxed with JavaScript bridges disabled or strictly allowlisted; no PHI passed via implicit intents.

---

## 7. FHIR & SMART-on-FHIR security

The backend exposes/consumes **HL7 FHIR R4** (Volume 4) and follows **SMART on FHIR** authorization concepts.

- **OAuth2 scopes (SMART scopes):** access is granted in terms of resource-and-action scopes such as `patient/Observation.read`, `patient/MedicationStatement.read`, `user/Patient.read` (clinician acting in a user context), and write scopes only where the role requires them. Scopes are least-privilege and consent-bounded.
- **Launch context & patient binding:** a token is bound to a patient context; servers enforce that `patient/*` scopes can only read the *in-context* patient — preventing horizontal access (IDOR) across patients even with a valid token.
- **FHIR Consent resource:** patient consent (what is shared, with whom, for how long) is represented as a FHIR `Consent` resource and **enforced at the API layer**, not merely recorded. Revoking consent revokes access immediately.
- **Validation & integrity:** all inbound FHIR resources are schema-validated and profile-validated; provenance is captured (`Provenance` / `AuditEvent`) so the source of every clinical datum (patient self-report vs. device vs. clinician) is known and trustworthy.
- **Bulk/export endpoints** are heavily restricted, MFA-gated, rate-limited, and fully audited.

---

## 8. Audit logging

Aligns with the Volume 4 `audit_log` model and satisfies HIPAA audit controls and GDPR accountability.

### 8.1 Properties

- **Immutable & tamper-evident.** Audit records are append-only and write-once (WORM-style storage or hash-chained / cryptographically-sequenced entries so deletion or alteration is detectable). Audit logs are stored separately from application data with their own access controls; no application role can delete them.
- **Attributable & complete.** Each entry records *who* (subject identity + role), *what* (action + resource type/ID, never the PHI value itself), *when* (trusted timestamp), *where* (source IP / device / service), and *outcome* (allow/deny). Logs never contain PHI values (§6.4).

### 8.2 Events that MUST be audited

- Authentication events: login success/failure, MFA, token issue/refresh/revoke, logout.
- **Every PHI access:** read, create, update, delete of any C4/C3 resource — including each clinician view of a patient record and each export.
- Authorization decisions, especially **denials** and consent grants/revocations.
- Administrative actions: role/permission changes, configuration changes, key rotations, BAA/vendor changes.
- Device-ingest events (Volume 5) and AI-coach invocations (Volume 6) that read PHI.
- Security-relevant events: pinning failures, attestation failures, anomaly detections, rate-limit triggers.

### 8.3 Retention & access

- Audit logs retained **≥6 years** (aligns with HIPAA's documentation-retention expectation) and protected for their full life; retention is configurable per regulatory jurisdiction.
- Read access to audit logs is itself restricted (security/compliance roles), and reading the audit log is *also* audited.
- Logs feed monitoring/SIEM for detection (§12).

---

## 9. Threat model (STRIDE)

A STRIDE analysis of the four highest-value data flows. (S=Spoofing, T=Tampering, R=Repudiation, I=Information disclosure, D=Denial of service, E=Elevation of privilege.) This table is an input to the GDPR DPIA (§2.2).

| # | Data flow | STRIDE category | Threat | Mitigation | Ref |
|---|-----------|-----------------|--------|------------|-----|
| TM-1 | **Patient login** (app → IdP → backend) | S — Spoofing | Credential stuffing / account takeover | OIDC + PKCE, throttling/lockout, optional patient MFA, anomaly detection, breach-password checks | §4.1–4.3 |
| TM-2 | Patient login | E — Elevation | Stolen refresh token reused for persistent access | Short-lived access tokens, rotating refresh tokens with **reuse detection** → family revocation | §4.2 |
| TM-3 | **Observation sync** (device cache → backend) | T — Tampering | MITM alters a glucose value in transit | TLS 1.2+ with **certificate pinning**; integrity-checked payloads; server-side validation | §5.1, §6.2 |
| TM-4 | Observation sync | I — Information disclosure | PHI read from a lost/stolen or rooted phone | **Encrypted local store** + Keystore keys; root detection blocks sync; `FLAG_SECURE`; remote logout/crypto-shred | §6.1, §6.3 |
| TM-5 | Observation sync | R — Repudiation | Disputed/forged data of unknown origin | `Provenance`/`AuditEvent`, signed device attestation, immutable audit log | §7, §8 |
| TM-6 | **Clinician access** (panel → backend → patient PHI) | E — Elevation / I | Clinician (or attacker with a clinician token) reads a patient they have no relationship with (IDOR) | Server-side **RBAC + consent/relationship checks**, patient-bound FHIR scopes, default-deny, full audit | §4.4, §7 |
| TM-7 | Clinician access | S | Phished clinician credentials | **Mandatory clinician MFA** / WebAuthn, SSO, impossible-travel detection, session limits | §4.3 |
| TM-8 | Clinician access | D — Denial of service | Bulk-export endpoint abused to exfiltrate or to overload | Rate limiting, MFA + re-auth for bulk export, anomaly alerts, WAF | §7, §11 |
| TM-9 | **AI inference** (patient context → AI coach → response) | I | Sensitive prompt/transcript leaks to the LLM vendor or other tenants | BAA-covered LLM provider, minimized context, no training on PHI, tenant isolation, C4 handling of transcripts | §13 |
| TM-10 | AI inference | T | **Prompt injection** makes the coach give unsafe or out-of-scope (clinical) advice | Input/output filtering, system-prompt hardening, scope guardrails, refusal of clinical claims, human-safe templating | §13 |
| TM-11 | AI inference | E | Injected content triggers tool calls that exceed authorization | No privileged tool access from model output without server-side authz revalidation; least-privilege tool scopes | §13 |
| TM-12 | Cross-cutting | R | Insider deletes or alters audit trail to hide misuse | **Immutable/append-only audit store**, segregation of duties, audit-of-audit-reads | §8 |

---

## 10. Privacy by design

### 10.1 Data minimization

Collect only what each purpose requires (GDPR Art. 5(1)(c); HIPAA minimum-necessary). The schema (Volume 4) avoids unnecessary identifiers; analytics use pseudonymous IDs; the device caches the minimum needed for offline use. New fields require a documented purpose before they are added.

### 10.2 Purpose limitation & no secondary use

PHI is used only for the consented purpose. **Self-management data is never repurposed for research, marketing, or model training without separate, explicit, revocable consent.** Advertising/ad-tech SDKs are prohibited from receiving any C3/C4 data.

### 10.3 Retention schedule

| Data | Default retention | Trigger to delete |
|------|-------------------|-------------------|
| Active patient PHI (observations, logs) | While account active | Account deletion or consent revocation → erasure within 30 days |
| AI-coach transcripts (C4) | Limited window (e.g. 90 days) unless user retains | TTL expiry or user delete |
| Audit logs | ≥6 years (regulatory) | End of retention window |
| De-identified analytics (C2) | Indefinite (no longer personal data) | N/A |
| Backups | Rolling window; deletions propagate | Backup cycle expiry |

Retention is enforced automatically (scheduled jobs), not manually.

### 10.4 De-identification for analytics

Analytics and research use **de-identified or pseudonymized** data. De-identification follows HIPAA Safe Harbor (strip the 18 identifiers) or Expert Determination; the **re-identification key is held in a separate key domain** (§5.3) the analytics store cannot access, so the analytics environment is non-re-identifiable on its own. Aggregation/k-anonymity thresholds prevent small-cell re-identification.

### 10.5 Consent management

Granular, **opt-in**, per-purpose consent captured at onboarding and changeable anytime: (a) core self-management, (b) clinician/clinic sharing (per relationship), (c) optional research/analytics. Consent records are versioned and timestamped, surfaced as a FHIR `Consent` resource (§7), and **enforced** — not just stored. Withdrawal is as easy as granting and takes effect immediately.

### 10.6 Data-subject / individual rights requests

A self-service flow plus a backstopped manual process handles:

- **Export / portability (GDPR Art. 15/20; HIPAA right of access):** machine-readable export (FHIR + JSON/CSV) of the patient's data, delivered within statutory timeframes (HIPAA 30 days; GDPR 1 month).
- **Erasure (GDPR Art. 17):** account-and-data deletion that propagates to backups and processors, **except** records the platform is legally required to retain (e.g. audit logs), which are documented as a lawful retention exception. Erasure crypto-shreds device-local data.
- **Rectification / restriction / objection:** supported via the patient app and clinician workflows.

Every DSAR is identity-verified, audited, and tracked to SLA (`SEC-026`).

---

## 11. Vulnerability management

| Activity | Cadence / gate | Detail |
|----------|----------------|--------|
| **SAST** | Every PR / CI | Static analysis of app + backend; high/critical findings block merge |
| **DAST** | Pre-release + scheduled | Dynamic scanning of the running backend/API and clinician panel |
| **SCA (dependency scanning)** | Every PR + daily | Flags vulnerable npm/server dependencies; criticals block release; auto-PRs for patches |
| **SBOM** | Every build | Generate and store a CycloneDX/SPDX SBOM per build for supply-chain transparency and rapid CVE response |
| **Secret scanning** | Every push (`SEC-021`) | Pre-commit + server-side; blocks commits containing credentials |
| **Container/IaC scanning** | CI | Image and infrastructure-as-code misconfiguration scanning |
| **Penetration testing** | **≥ annually** and before any major release that changes the PHI attack surface | Independent third-party test covering OWASP MASVS (app), OWASP ASVS/API Top 10 (backend), and the threat model in §9 |
| **Mobile MASVS verification** | Per major mobile release | Verify against MASVS-L2/R |

**Patch SLAs:** critical vulns remediated ≤7 days, high ≤30 days, medium ≤90 days (in production). A **responsible-disclosure / security.txt** program provides a clear reporting channel (`security@…`), a safe-harbor statement for good-faith researchers, and a triage SLA; findings feed the same tracker. All scanning gates are wired into the Volume 10 build playbook.

---

## 12. Incident response & breach notification

### 12.1 Process

A documented IR plan (NIST 800-61 lifecycle) with named roles, an on-call rotation, and severity tiers covers: **Preparation → Detection & Analysis → Containment → Eradication → Recovery → Post-incident review.** Detection is driven by SIEM alerts on the audit/security event stream (§8), anomaly detection, and the disclosure channel. Every incident is logged, evidence is preserved (forensics-ready), and a blameless post-mortem with corrective actions is mandatory.

### 12.2 Breach notification clocks

A **PHI/personal-data breach** triggers parallel, jurisdiction-specific obligations:

| Regime | Clock | Who is notified |
|--------|-------|-----------------|
| **HIPAA Breach Notification Rule** | Without unreasonable delay, **≤60 days** from discovery | Affected individuals; HHS; media if ≥500 individuals; business-associate→covered-entity notice |
| **GDPR Art. 33/34** | **≤72 hours** from awareness to supervisory authority; affected individuals "without undue delay" when high risk | DPA; data subjects |
| **US state laws** | Varies | As applicable |

**Encryption safe harbor:** if breached PHI was encrypted to NIST standards (§5), HIPAA breach-notification obligations may not be triggered — reinforcing why encryption (`SEC-008/009/010`) is mandatory. A breach-assessment runbook determines, per incident, whether the notification clocks start.

---

## 13. AI-specific security

References the **Volume 6** AI Health Coach. The coach is a **safety-bounded, educational** assistant — not a diagnostic or treatment tool — and security must preserve that boundary.

- **Prompt injection (TM-10/11).** Treat all model input — user messages **and** retrieved/device data injected into context — as untrusted. Defenses: hardened system prompts with explicit scope and refusal rules; input/output filtering and content classification; isolating untrusted retrieved content from instructions; **never letting model output trigger privileged actions/tool calls without server-side authorization revalidation** (least-privilege tools).
- **Data leakage (TM-9).** The LLM provider must be **BAA-covered** before any PHI is sent; context is **minimized** to the least data needed; the provider must contractually **not train on or retain** PHI; multi-tenant isolation prevents cross-patient bleed. AI transcripts are **C4 PHI** with full §6.4 logging discipline (redaction before any log/analytics sink).
- **Output safety / scope enforcement.** The coach must refuse to make individualized clinical claims, dosing recommendations, or diagnoses (Volume 1/6 guardrails); guardrail violations are filtered and audited. This is both a safety control and the line that keeps the product out of SaMD scope (§2.4).
- **Abuse & integrity.** Rate-limiting, jailbreak-attempt detection, and logging of safety-filter triggers (without PHI) feed monitoring.

---

## 14. Compliance requirements (SEC-IDs)

Each requirement is testable; acceptance criteria are the verification basis for Volume 9 (QA).

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| **SEC-001** | Classify all data into C1–C4 and apply tier controls | Data dictionary tags every field; no C3/C4 field lacks an owner and control set |
| **SEC-002** | No PHI to any processor without a signed BAA/DPA | Vendor register shows BAA/DPA before first PHI flow; release gate enforced |
| **SEC-003** | Establish HIPAA Security Rule technical safeguards | Documented mapping of access/audit/integrity/auth/transmission controls; risk analysis on file |
| **SEC-004** | GDPR lawful basis + explicit consent for health data | Per-purpose consent captured, versioned, and enforced; lawful-basis register maintained |
| **SEC-005** | Complete a DPIA before first production PHI sync | Signed-off DPIA referencing §9 threat model; revisited per high-risk change |
| **SEC-006** | Maintain an ISO 27001-aligned ISMS with SoA | Risk register, Statement of Applicability, and policies exist and are reviewed |
| **SEC-007** | Gate any clinical-claim change through a regulatory review | No clinical/diagnostic feature ships without documented intended-use + regulatory sign-off |
| **SEC-008** | TLS 1.2+ for all transit; cleartext disabled | Config scan shows no TLS<1.2, no cleartext; HSTS present; mTLS internal |
| **SEC-009** | AES-256 at rest for all PHI stores incl. backups | Storage/KMS config audit confirms encryption; restores verified encrypted |
| **SEC-010** | Replace plaintext `AsyncStorage` with Keystore-backed encrypted storage | No PHI persisted unencrypted on device; keys non-exportable; PHI excluded from backup |
| **SEC-011** | Certificate pinning on app↔backend channel | Pinned connection; MITM with rogue cert is rejected and logged |
| **SEC-012** | KMS-managed keys with documented rotation | Rotation schedule enforced and audited; no hard-coded keys in code/binary |
| **SEC-013** | Root/jailbreak detection + integrity attestation gating PHI | Rooted/failed-attestation device cannot sync PHI; downgrades to educational mode |
| **SEC-014** | Platform protections on PHI screens | `FLAG_SECURE` set; screenshots blocked; recents blurred; clipboard restricted |
| **SEC-015** | OAuth2 Authorization Code + PKCE for all clients | No implicit flow; PKCE verified; tokens scoped and short-lived |
| **SEC-016** | Zero PHI/secrets in any log or crash report | Log audit + automated scanner find no PHI/secret patterns; redaction layer enforced |
| **SEC-017** | Mandatory MFA for clinician/admin accounts | Clinician account cannot complete login without MFA |
| **SEC-018** | SAST + SCA + secret scanning block release on criticals | CI fails on critical findings; evidence retained per build |
| **SEC-019** | SBOM generated and stored per build | SBOM artifact exists for each release build and is queryable for CVEs |
| **SEC-020** | Independent penetration test ≥ annually and pre-major-release | Report on file with remediation tracked to closure |
| **SEC-021** | Secret scanning on every push | Commit containing a credential is blocked/flagged |
| **SEC-022** | Immutable, attributable audit log of all PHI access | Append-only store; tamper attempt detectable; every PHI read/write produces an entry |
| **SEC-023** | Audit-log retention ≥6 years with restricted read access | Retention enforced; audit-log reads are themselves audited |
| **SEC-024** | Server-side RBAC + consent/relationship enforcement | Clinician without consent/relationship is denied; denial audited; verified by IDOR tests |
| **SEC-025** | FHIR access via least-privilege SMART scopes + Consent enforcement | Out-of-context patient access rejected; consent revocation revokes access immediately |
| **SEC-026** | Data-subject export & erasure within statutory timeframes | Export is machine-readable and complete; erasure propagates to backups/processors; both audited |
| **SEC-027** | Data minimization & retention schedule enforced automatically | Scheduled jobs delete per §10.3; new fields require a documented purpose |
| **SEC-028** | De-identification with segregated re-identification keys | Analytics store cannot re-identify; key domain separated; small-cell suppression in place |
| **SEC-029** | Documented IR plan with breach-notification clocks | Tabletop exercise passed; runbook covers HIPAA 60-day & GDPR 72-hour timelines |
| **SEC-030** | Regulatory gate before any SaMD-class feature | Intended-use statement + regulatory strategy approved pre-development |
| **SEC-031** | AI coach: BAA-covered LLM, minimized PHI context, no training on PHI | Provider BAA + no-train clause on file; context minimization verified; transcripts handled as C4 |
| **SEC-032** | AI prompt-injection & output-scope defenses | Injection test suite passes; model output cannot trigger unauthorized tool calls; clinical claims refused |

---

## 15. Security controls checklist

**Identity & access**
- [ ] OAuth2 Authorization Code + PKCE; no implicit flow (`SEC-015`)
- [ ] Short-lived access tokens; rotating refresh tokens with reuse detection
- [ ] Mandatory MFA for clinicians/admins; offered to patients (`SEC-017`)
- [ ] Server-side default-deny RBAC + consent/relationship checks (`SEC-024`)
- [ ] Session idle/absolute timeouts; re-auth for sensitive actions

**Cryptography**
- [ ] TLS 1.2+ everywhere; cleartext disabled; mTLS internal (`SEC-008`)
- [ ] Certificate pinning with backup pin & rotation runbook (`SEC-011`)
- [ ] AES-256 at rest incl. backups (`SEC-009`)
- [ ] KMS/HSM key management with rotation; no hard-coded keys (`SEC-012`)
- [ ] Secrets in a vault; secret scanning in CI (`SEC-021`)

**Mobile hardening**
- [ ] `AsyncStorage` → Keystore-backed encrypted storage; PHI off backup (`SEC-010`)
- [ ] Root/jailbreak detection + integrity attestation gating sync (`SEC-013`)
- [ ] Obfuscation, anti-tamper, anti-debug (MASVS-RESILIENCE)
- [ ] `FLAG_SECURE`, screenshot/clipboard protections (`SEC-014`)
- [ ] No PHI/secrets in logs or crash reports (`SEC-016`)
- [ ] Hardened manifest: no needless exports, `allowBackup` controlled, no debug in release

**Data & FHIR**
- [ ] Data classified C1–C4 with controls (`SEC-001`)
- [ ] Least-privilege SMART scopes; patient-bound context; Consent enforced (`SEC-025`)
- [ ] Provenance captured on clinical data

**Audit & monitoring**
- [ ] Immutable, attributable audit log of all PHI access (`SEC-022`)
- [ ] ≥6-year retention; restricted, audited read access (`SEC-023`)
- [ ] SIEM detection on security events

**Privacy**
- [ ] Per-purpose explicit consent, enforced & revocable (`SEC-004`)
- [ ] Data minimization + automated retention/erasure (`SEC-027`)
- [ ] De-identification with segregated keys (`SEC-028`)
- [ ] DSAR export/erasure within SLA (`SEC-026`)
- [ ] DPIA completed and current (`SEC-005`)

**Vulnerability & supply chain**
- [ ] SAST/DAST/SCA gating; SBOM per build (`SEC-018`, `SEC-019`)
- [ ] Pen test ≥ annually & pre-major-release (`SEC-020`)
- [ ] Responsible-disclosure program + security.txt

**Governance & response**
- [ ] BAAs/DPAs before PHI flows to any processor (`SEC-002`)
- [ ] ISO 27001-aligned ISMS + SoA (`SEC-006`)
- [ ] IR plan with HIPAA 60-day & GDPR 72-hour clocks (`SEC-029`)
- [ ] Regulatory gate for any SaMD-class change (`SEC-007`, `SEC-030`)

**AI**
- [ ] BAA-covered LLM, minimized context, no training on PHI (`SEC-031`)
- [ ] Prompt-injection & output-scope defenses; transcripts as C4 (`SEC-032`)

---

## 16. Traceability & cross-references

This volume defines the security and compliance posture that constrains every other volume; the controls here are gates on their delivery.

- **[01-product-vision.md](01-product-vision.md)** — Business goal **BG-005** (clinical-grade security/compliance), the educational-only guardrail, and the roadmap that moves the platform from local-only to synced PHI. This volume is the canonical realization of that goal.
- **[02-android-app-prd.md](02-android-app-prd.md)** — Mobile hardening (§6), the `AsyncStorage`→encrypted-storage migration (`SEC-010`), certificate pinning, root detection, `FLAG_SECURE`, and secure-logging requirements apply to the patient app.
- **[03-doctor-panel.md](03-doctor-panel.md)** — Clinician MFA (`SEC-017`), RBAC + consent enforcement (`SEC-024`), session management, and bulk-export controls (§4, §7) govern the web panel.
- **[04-backend.md](04-backend.md)** — OAuth2/OIDC identity, RBAC, the `audit_log` model (§8), encryption/KMS (§5), FHIR R4 + SMART scopes (§7), and the consent model are co-specified with the backend.
- **[05-medical-devices.md](05-medical-devices.md)** — Device-ingest security: payload validation, provenance/attestation, device serial numbers as HIPAA identifiers (C4), and the observation-sync threat flows (TM-3/4/5).
- **[06-ai-system.md](06-ai-system.md)** — AI-specific security (§13): prompt-injection defenses, data-leakage controls, BAA-covered LLM, and transcript handling as C4 PHI (`SEC-031/032`).
- **[07-uiux-design-system.md](07-uiux-design-system.md)** — UX for consent capture, MFA enrollment, privacy disclosures, screenshot-protected sensitive screens, and clear educational-only/safety messaging.
- **[09-qa-testing.md](09-qa-testing.md)** — The `SEC-NNN` acceptance criteria (§14) are the source for security test cases, MASVS verification, IDOR/authorization tests, and pen-test scoping.
- **[10-claude-code-build-playbook.md](10-claude-code-build-playbook.md)** — CI/CD wiring of SAST/DAST/SCA/SBOM/secret-scanning gates (§11), signed builds, and release gates that enforce these requirements.

_End of Volume 8._
