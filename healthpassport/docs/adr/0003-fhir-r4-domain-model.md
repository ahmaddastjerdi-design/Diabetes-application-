# ADR-0003 — FHIR R4-aligned internal domain model

- Status: Accepted
- Date: 2026-07-09
- Deciders: Health-Data Interoperability Architect, Principal Architect

## Context

The product must interoperate with the wider health system (EHR/FHIR exchange,
physician tooling, portability) in later phases. The most expensive thing to
change later is the **data model**. We want to avoid a "rewrite the model to add
FHIR" phase.

## Decision

Model the internal domain as a **FHIR R4 subset**: `Patient`, `Observation`,
`Condition`, `MedicationStatement`, `AllergyIntolerance`, `Immunization`,
`Consent`, `DiagnosticReport`/`DocumentReference`. Populate standard codes from
day one — **LOINC** (observations), **SNOMED CT / ICD-10** (conditions),
**RxNorm / ATC** (medications), **UCUM** (units) — using a small curated value
set per concept, stored in `domain/valuesets/` with source references.

## Consequences

**Positive**
- Export is serialization, not transformation; the app emits valid FHIR
  `Bundle`s for portability and backup.
- Later EHR/FHIR integration and the physician platform are mapping/transport
  projects, not modeling projects.
- Shared vocabulary with clinicians and health systems from the start.

**Negative / trade-offs**
- FHIR resources are verbose; we carry a curated subset and pragmatic TypeScript
  types rather than the full spec to keep the client lean.
- Terminology curation is ongoing work; value sets expand per feature. Mitigated
  by keeping catalogs small, sourced, and reviewed.

## Alternatives considered

- **A bespoke minimal model, map to FHIR later**: rejected — guarantees a costly
  remodel and risks lossy mappings for exactly the codes clinicians rely on.
- **Full FHIR spec types**: rejected for Phase 1 — unnecessary weight; a curated
  subset covers the PHR/chronic-care needs and stays conformant on the wire.
