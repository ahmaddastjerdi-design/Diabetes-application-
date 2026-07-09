# HealthPassport Pro — FHIR Mapping

Status: Phase 0 · Owner: Health-Data Interoperability Architect

Internal models are **FHIR-inspired** (R4). `lib/fhir` provides pure mapping
functions from our Prisma entities to conformant FHIR resources, so export and
future EHR integration are serialization, not remodeling.

---

## 1. Resource coverage & mapping functions

| Internal (Prisma) | FHIR resource | Mapping function |
|-------------------|---------------|------------------|
| `PatientProfile` (+`User`) | `Patient` | `toFhirPatient()` |
| `VitalObservation`, `LabResult` | `Observation` | `toFhirObservation()` |
| `Condition` | `Condition` | `toFhirCondition()` |
| `Medication` | `MedicationRequest` | `toFhirMedicationRequest()` |
| `Allergy` | `AllergyIntolerance` | `toFhirAllergyIntolerance()` |
| `Encounter` | `Encounter` | `toFhirEncounter()` |
| `CarePlan` | `CarePlan` | `toFhirCarePlan()` |
| `Document` | `DocumentReference` | `toFhirDocumentReference()` |
| (collection) | `Bundle` (type `collection`) | `toFhirBundle()` |

## 2. Terminology
- Observations/labs: **LOINC** codes; **UCUM** units.
- Conditions: **SNOMED CT** + **ICD-10**.
- Medications: **RxNorm** / **ATC**.
- Allergies: SNOMED CT / RxNorm.
- Documents: LOINC document type where known.
Curated value sets live in `lib/fhir/valuesets/*` with source references (ported
from the prototype's tested value sets).

## 3. Example mappings

**VitalObservation (glucose) → Observation**
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

**Blood pressure → Observation with components** (panel LOINC `85354-9`; systolic
`8480-6`, diastolic `8462-4`).

**Condition (Type 2 diabetes) → Condition** (SNOMED `44054006`, ICD-10 `E11`,
`clinicalStatus` mapped from our enum).

**Medication → MedicationRequest**
```jsonc
{
  "resourceType": "MedicationRequest",
  "status": "active",
  "intent": "order",
  "medicationCodeableConcept": { "text": "Metformin",
    "coding": [{ "system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "..." }] },
  "subject": { "reference": "Patient/<id>" },
  "dosageInstruction": [{ "text": "500 mg twice daily" }]
}
```
> Note: a patient-reported medication maps to `MedicationRequest` with
> `status`/`intent` reflecting that it is a self-reported current medication, not
> a system-generated prescription. (`MedicationStatement` is an acceptable
> alternative; V1 standardizes on `MedicationRequest` per this spec.)

**Allergy → AllergyIntolerance** (`patient` reference, `criticality`,
`reaction[].manifestation`).

**Encounter → Encounter**; **CarePlan → CarePlan**; **Document →
DocumentReference** (`content[].attachment` with `contentType` + signed URL or
`DocumentReference.content.attachment.url`, plus `hash`).

## 4. Units & conversion
Units follow **UCUM**. Glucose and cholesterol support mg/dL ↔ mmol/L; weight
kg ↔ lb; temperature °C ↔ °F — pure, unit-tested converters in `lib/fhir/units`
(ported). Stored values keep their original unit + UCUM code (lossless);
conversion is display/evaluation-time only.

## 5. Export & import
- **Export**: `toFhirBundle()` yields a `Bundle` (`type: collection`) for
  portability and backup; the doctor report can attach or reference it.
- **Import (later phase)**: accept a FHIR Bundle, validate against the supported
  resource/value-set subset; unknown resources preserved but not interpreted.

## 6. Future EHR integration (later phase)
- Stand up / connect a FHIR R4 server; patient records sync as FHIR resources.
- **SMART on FHIR** launch for physician-side access.
- **Bulk Data ($export)** for population/panel features.
Because `lib/fhir` already emits conformant resources with proper codes, these
are integration projects, not modeling projects.
