# HealthPassport Pro — Roadmap

Status: living document · Owner: Chief Product Officer

Delivery is phased so that each phase is shippable and safe, and no phase
requires undoing an earlier one. Phase 1 is a genuinely usable patient product.

---

## Phase 1 — Patient PWA (MVP) — *in progress*

Goal: a private, offline-first, clinically-safe personal health record with
chronic-disease tracking, education, and physician-ready reports.

- [x] Architecture, security, clinical-safety, interoperability foundations (docs)
- [ ] Installable PWA shell (offline, service worker, i18n/RTL)
- [ ] FHIR-aligned domain model + encrypted offline store + audit log
- [ ] Core PHR: profile, observations/vitals, conditions, medications, allergies
- [ ] Chronic-care module: diabetes + hypertension tracking, targets, trends
- [ ] Clinical-safety engine: red-flag escalation, disclaimers, guarded education
- [ ] Physician-ready report + FHIR Bundle export
- [ ] Accessibility (WCAG 2.2 AA pass), security hardening, CI

**Exit criteria**: a patient can install the app, record their record offline
with PHI encrypted at rest, track diabetes/BP against targets, receive safe
guidance with red-flag escalation, and export a physician-ready report + FHIR
Bundle. Domain and safety logic are unit-tested; CI is green.

## Phase 2 — Depth & trust

- More conditions (lipids, CKD staging inputs, asthma/COPD basics).
- Medication adherence + reminders; symptom journaling.
- Richer trends and patient-facing insights (all safety-gated).
- Clinician content review workflow operationalized; expanded value sets.
- WebAuthn unlock; encrypted local backup/restore.
- Formal accessibility and clinical-safety audits.

## Phase 3 — Backend & sync

- Cloud PHR/FHIR store (R4) + Postgres; OIDC identity; consent service.
- Delta sync from the PWA behind the existing repository seam.
- WORM audit log; regional data residency; HIPAA/GDPR control implementation.
- Backup/recovery with consented key escrow.

## Phase 4 — Physician platform

- Physician dashboard (consent-scoped patient panels, CQRS read model).
- Care-pathway authoring and patient-facing pathway execution.
- Scale-out to 100,000 physicians; tenant isolation.
- SMART on FHIR launch inside EHRs; Bulk Data for panels.

## Phase 5 — DSS / AI (guarded)

- Decision-support and AI features in an isolated service.
- Every output passes the same clinical-safety contract as the client.
- Clinician-in-the-loop for anything beyond education; SaMD/MDR assessment as
  required before any diagnostic/therapeutic capability.

## Phase 6 — Ecosystem

- Full EHR/FHIR exchange with partner systems.
- Research/quality features on **consented, de-identified** data only.
- Additional locales and regional guideline packs.

---

## Test strategy across phases

- **Unit** (Phase 1+): domain calculations, unit conversions, safety rules,
  crypto round-trip/tamper-rejection, repository behavior.
- **Component/integration** (Phase 1–2): feature flows, offline behavior,
  accessibility assertions.
- **End-to-end** (Phase 2+): install → record → report → export, on real
  devices/browsers.
- **Security & safety gates** (always): safety-engine tests and crypto tests are
  release-blocking.

## Compliance milestones (business track)

- Phase 2–3: privacy review, DPIA, penetration test.
- Phase 3+: HIPAA/GDPR control attestation; SOC 2 / ISO 27001 as required by
  partners; clinical-safety case (e.g. DCB0129/0160-style) for regulated markets.
