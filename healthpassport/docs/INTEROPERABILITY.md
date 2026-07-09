# HealthPassport Pro — Interoperability (FHIR R4)

Status: living document · Owner: Health-Data Interoperability Architect

The internal data model is a **FHIR R4** subset. This is a deliberate Phase-1
choice (ADR-0003) so that EHR/FHIR exchange in a later phase is a *serialization
and transport* problem, not a data-model rewrite.

---

## 1. Resource coverage (Phase 1 subset)

| Concept | FHIR resource | Terminology |
|---------|---------------|-------------|
| The patient | `Patient` | — |
| Vitals & lab readings (glucose, BP, weight, HbA1c, …) | `Observation` | **LOINC** codes; **UCUM** units |
| Chronic conditions & problems | `Condition` | **SNOMED CT** / **ICD-10** |
| Medications the patient takes | `MedicationStatement` | **RxNorm** / **ATC** |
| Allergies & intolerances | `AllergyIntolerance` | SNOMED CT / RxNorm |
| Immunizations | `Immunization` | CVX |
| Sharing permissions | `Consent` | — |
| Reports / documents | `DiagnosticReport` / `DocumentReference` | LOINC |

Phase 1 stores these as FHIR-shaped TypeScript entities with the standard code
fields populated. We keep a **small, curated value set** per concept (the
readings a chronic-care PHR actually needs) rather than the full terminology, and
expand as needed.

---

## 2. Why FHIR-aligned from day one

- **No rewrite later.** Adding a backend/EHR bridge becomes mapping our entity to
  the wire format, since the shape and codes already match.
- **Portability is a feature.** Export produces a valid FHIR `Bundle` the patient
  can take to any FHIR-capable system.
- **Shared language with clinicians and EHRs.** LOINC/SNOMED/RxNorm/UCUM are what
  the health system already speaks.

---

## 3. Example mappings

**A home blood-glucose reading → `Observation`**
```jsonc
{
  "resourceType": "Observation",
  "status": "final",
  "category": [{ "coding": [{ "code": "vital-signs" }] }],
  "code": { "coding": [{ "system": "http://loinc.org", "code": "2339-0",
                         "display": "Glucose [Mass/volume] in Blood" }] },
  "subject": { "reference": "Patient/<id>" },
  "effectiveDateTime": "2026-07-09T08:00:00Z",
  "valueQuantity": { "value": 132, "unit": "mg/dL",
                     "system": "http://unitsofmeasure.org", "code": "mg/dL" }
}
```

**Type 2 diabetes on the problem list → `Condition`**
```jsonc
{
  "resourceType": "Condition",
  "clinicalStatus": { "coding": [{ "code": "active" }] },
  "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "44054006",
                         "display": "Type 2 diabetes mellitus" }] },
  "subject": { "reference": "Patient/<id>" }
}
```

The curated code catalog (LOINC/SNOMED/RxNorm/UCUM entries the app uses) lives in
`apps/web/src/domain/valuesets/` with source references.

---

## 4. Units & conversion

- Units follow **UCUM**. Glucose supports both **mg/dL** and **mmol/L** with a
  single canonical internal representation and a display-time converter (×/÷
  18.0182). Conversions are pure, unit-tested functions in `domain/units`.
- The user's unit preference is a display concern; stored values keep their
  original unit + UCUM code so nothing is lossy.

---

## 5. Export / import

- **Export**: a FHIR `Bundle` (`type: collection`) of the patient's resources,
  plus a human-readable summary (see the physician-report feature). This is both
  the portability mechanism and the backup mechanism.
- **Import** (later): accept a FHIR Bundle to seed a record; validate against the
  supported resource/value-set subset; unknown resources are preserved but not
  interpreted.

---

## 6. EHR integration plan (later phase)

- Stand up / connect to a FHIR R4 server; the patient's local record syncs as
  FHIR resources.
- **SMART on FHIR** app-launch for physician-side access within EHRs.
- **Bulk Data ($export)** for population/panel features on the physician side.
- Consent (`Consent` resource) governs every cross-organization read.

Because the client already emits conformant resources with proper codes, these
are integration projects, not modeling projects.
