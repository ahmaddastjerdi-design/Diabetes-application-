# HealthPassport Pro — Privacy Model

Status: Phase 0 · Owners: Security Engineer, Clinical Safety Officer

HealthPassport Pro is **privacy-first**. Patients own their data; the product
collects only what it needs, uses it only for the patient's own care, and gives
patients real control (access, export, erasure).

---

## 1. Data classification

| Class | Examples | Handling |
|-------|----------|----------|
| **PHI (highest)** | Conditions, meds, vitals, labs, symptoms, documents, reports | Access-controlled, owner-scoped, audited; never sold/shared; never in analytics |
| **Account** | Email, password hash, sessions | Standard secure auth handling |
| **Sensitive config** | Consent records, settings | Owner-scoped |
| **Non-sensitive** | Theme, locale, UI prefs | Low-risk |

## 2. Core principles
- **Patient ownership** — the patient owns their record; the platform is a
  custodian.
- **Data minimization** — collect only what a chronic-care PHR needs; every field
  has a purpose.
- **Purpose limitation** — PHI is used only to render the patient's own record,
  produce their reports, and drive their care features. **No secondary use.**
- **No third-party trackers** touching PHI — ever. V1 ships no ad/analytics SDKs
  on PHI screens; any product analytics is de-identified and separated from
  clinical data (see [`SCALABILITY_PLAN.md`](SCALABILITY_PLAN.md)).

## 3. Consent (the `Consent` model)
Consent is a first-class, **granular, versioned, revocable, audited** record:
- Captured at onboarding: `TERMS`, `PRIVACY`, `MEDICAL_DISCLAIMER`,
  `DATA_PROCESSING`, and (opt-in) `OFFLINE_SUMMARY`.
- Each consent stores the **policy version** and grant/revoke timestamps.
- Consent changes write an `AuditLog CONSENT_CHANGE` entry.
- The **limited offline summary** (PWA) is stored on-device **only with explicit
  `OFFLINE_SUMMARY` consent**, and cleared when revoked or on logout.

## 4. Patient rights (GDPR Art. 15/16/17/20 aligned)
- **Access** — view all their data in-app.
- **Rectification** — edit any record.
- **Portability / export** — download the full record as JSON and FHIR bundle
  (audited `EXPORT`).
- **Erasure** — "erase my data" performs a **hard delete** across clinical tables
  and object storage, distinct from the everyday **soft delete**
  (`deletedAt`) used for undo/history.

## 5. Soft delete vs. hard erasure
- **Soft delete** (default): clinical rows set `deletedAt`; hidden from the app,
  retained for undo/history/audit continuity.
- **Hard erasure** (privacy right): irreversibly removes the patient's rows and
  their documents from object storage; audit retains a minimal, PHI-free record
  that erasure occurred.

## 6. Retention
- PHI retained while the account is active and per applicable regulation.
- Documents live in object storage with lifecycle policies; deletions cascade to
  storage.
- Audit log retained per regulatory requirement; PHI-free.

## 7. Data location & third parties
- V1 processors: managed PostgreSQL, object storage, and hosting — chosen for
  region/data-residency and covered by DPAs (documented in
  [`DEPLOYMENT.md`](DEPLOYMENT.md)).
- Regionalization for data-residency laws is a scaling concern
  (see [`SCALABILITY_PLAN.md`](SCALABILITY_PLAN.md)).

## 8. Analytics separation
Any product/usage analytics is **de-identified** and stored **separately** from
clinical data; PHI never enters analytics pipelines.

## 9. Compliance posture
Designed toward **GDPR** and **HIPAA** controls. Specific certifications
(SOC 2 / ISO 27001 / HITRUST) are business milestones. A **DPIA** (Data
Protection Impact Assessment) and privacy review are completed before public
launch.

## 10. Transparency
Plain-language **Privacy Policy**, **Terms of Use**, and **Medical Disclaimer**
pages are part of V1 (public routes), versioned to match `Consent.version`.
