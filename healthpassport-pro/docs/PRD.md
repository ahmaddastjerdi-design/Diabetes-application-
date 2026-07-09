# HealthPassport Pro — Product Requirements Document (PRD)

Status: Phase 0 · Owner: Chief Product Officer · Audience: whole team

---

## 1. Vision

A world-class **personal health record and interactive chronic-disease care
platform** that patients trust with their most sensitive information. It helps
patients track chronic conditions, keep their records in one place, understand
their trends, receive safe education, recognize red flags early, and walk into
appointments with a physician-ready report.

Built by a founder with deep digital-health experience (Hamrah Doctor,
telemedicine, smart ECG/Holter, DSS, chronic-care systems), the product is held
to the standard of a **real medical product**, not a demo.

## 2. Users

### Version 1 (this build)
- **Patient** — the only user role in V1. Owns and manages their own record.

### Future phases (designed for, not built in V1)
- **Family caregiver** — delegated, consented access to a patient's record.
- **Physician** — dashboard, patient panels, care-pathway authoring.
- **Clinic admin** — tenant/user management.
- **Care coordinator** — cross-patient workflow.

Version 1 is architected so these roles are additive (see
[`ARCHITECTURE.md`](ARCHITECTURE.md) and [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md)).

## 3. Problem

Patients with chronic disease manage their health every day but see clinicians a
few times a year. The record of what happens between visits — vitals, labs,
symptoms, medications, adherence, questions — is scattered across paper, memory,
and disconnected apps. Patients arrive at visits without a clear summary, and
warning signs are missed.

## 4. Goals & non-goals

**Goals (V1)**
- Give patients a single, secure, private home for their health record.
- Make chronic-disease self-tracking effortless and legible (trends, targets).
- Provide safe, evidence-based education and **red-flag recognition**.
- Produce a **physician-ready report** for appointments.
- Meet real-world bars for **security, privacy, accessibility, and medical safety**.

**Non-goals (V1)**
- No diagnosis, prescribing, or treatment decisions (see §7).
- No physician/caregiver/admin roles yet.
- No live EHR/FHIR exchange yet (FHIR-*inspired* internal model + export only).
- No AI/DSS features yet.

## 5. Version 1 modules

| # | Module | Summary |
|---|--------|---------|
| 1 | Registration / login | Secure email + password auth, forgot-password |
| 2 | Onboarding | Guided first-run: consent, profile basics, conditions, emergency contact |
| 3 | Patient profile | Demographics, preferences, language, units |
| 4 | Conditions / problem list | Coded chronic conditions with status |
| 5 | Medications | Current medications, dosage text, adherence context |
| 6 | Allergies | Allergies/intolerances with severity and reaction |
| 7 | Vitals tracking | BP, glucose, weight, HR, temperature, etc. with charts |
| 8 | Lab tracking | HbA1c, lipids, eGFR/creatinine, etc. with trends |
| 9 | Symptoms | Symptom entries with red-flag screening |
| 10 | Daily check-in | Lightweight daily log (mood, adherence, key vitals) |
| 11 | Documents | Upload/store medical documents with metadata |
| 12 | Encounters / visits | Record of visits, reason, notes |
| 13 | Chronic disease guide | Evidence-based, reviewed educational content |
| 14 | Doctor report | Physician-ready summary, print/export/copy |
| 15 | Settings | Account, language, units, notifications |
| 16 | Privacy / security settings | Consent, sessions, data export, erasure |
| 17 | PWA installability | Installable app, offline shell |
| 18 | Limited offline summary | Consented offline copy of the latest health summary |

## 6. Chronic-disease focus (V1 content & tracking)

- Hypertension
- Type 2 diabetes
- Chronic kidney disease (CKD) risk
- Dyslipidemia / cardiovascular risk
- Obesity / metabolic syndrome
- Medication adherence
- Preventive-care reminders

## 7. Medical-safety boundaries (binding)

The app **must never** diagnose, prescribe, replace a physician, or recommend
starting / stopping / changing a medication.

The app **may** track data, educate, show trends, flag red-flag symptoms, and
recommend contacting a doctor or seeking emergency care.

**Global disclaimer (used verbatim across the product):**
> HealthPassport Pro is a personal health record and educational chronic care
> guide. It does not diagnose, prescribe, or replace your physician. For urgent
> symptoms such as chest pain, severe shortness of breath, fainting, stroke-like
> symptoms, or severe weakness, seek emergency medical care.

Full rules are specified in [`MEDICAL_SAFETY_RULES.md`](MEDICAL_SAFETY_RULES.md).

## 8. Experience principles

Premium, calm, trustworthy, **mobile-first**, and **elderly-friendly**.
Reference feeling: Apple Health simplicity + MyChart reliability + Noom
engagement + fintech-grade trust. Card-based UI, large readable typography,
generous spacing, explicit empty/loading/error/success states, and **one primary
action per screen**. Medical status is never communicated by color alone
(see [`ACCESSIBILITY_CHECKLIST.md`](ACCESSIBILITY_CHECKLIST.md)).

## 9. Success metrics (illustrative, to refine with the founder)

- Activation: % of new patients who complete onboarding and log ≥1 data point.
- Engagement: weekly active patients; daily check-in completion.
- Value: % of patients who generate a doctor report before a visit.
- Safety: 100% of red-flag inputs surface the correct escalation (tested).
- Trust: retention at 4/12 weeks; opt-in rates for offline summary.

## 10. Scope, phasing & approval

Delivery is phased (Phase 0 docs → Phase 11 deployment guide). See
[`ARCHITECTURE.md`](ARCHITECTURE.md) § Delivery phases. Work pauses for founder
approval at milestones. This PRD is the reference for what "done" means in V1.

## 11. Out of scope for V1 (tracked for later)

Physician dashboard, caregiver/admin/coordinator roles, live FHIR/EHR exchange,
AI/DSS, messaging/telemedicine, payments, and multi-tenant clinic management.
