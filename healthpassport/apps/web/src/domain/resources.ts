import type {
  AdministrativeGender,
  CodeableConcept,
  DateString,
  Instant,
  Quantity,
} from './primitives';

/**
 * FHIR R4-aligned resource subset for the patient PHR. Each resource carries a
 * `resourceType` discriminator, a local `id`, and an `updatedAt` for sync/audit.
 * These are intentionally pragmatic shapes — a curated subset of full FHIR —
 * that serialize cleanly to conformant resources on export.
 */

export interface ResourceBase {
  id: string;
  updatedAt: Instant;
}

/** FHIR `Patient` (the record owner). */
export interface Patient extends ResourceBase {
  resourceType: 'Patient';
  givenName?: string;
  familyName?: string;
  birthDate?: DateString;
  gender?: AdministrativeGender;
  /** IETF language tag preferred for care communication. */
  preferredLanguage?: string;
}

export type ObservationStatus = 'preliminary' | 'final' | 'amended';

/** FHIR `Observation` — a vital sign or lab reading (LOINC-coded). */
export interface Observation extends ResourceBase {
  resourceType: 'Observation';
  status: ObservationStatus;
  /** LOINC-coded concept describing what was measured. */
  code: CodeableConcept;
  /** When the measurement was taken. */
  effectiveDateTime: Instant;
  /** Simple numeric result (most home readings). */
  valueQuantity?: Quantity;
  /** For multi-component readings such as blood pressure (systolic/diastolic). */
  components?: Array<{ code: CodeableConcept; valueQuantity: Quantity }>;
  /** Free-text note the patient added (kept short; PHI). */
  note?: string;
}

export type ClinicalStatus = 'active' | 'recurrence' | 'remission' | 'resolved';

/** FHIR `Condition` — a problem/diagnosis on the record (SNOMED/ICD-10). */
export interface Condition extends ResourceBase {
  resourceType: 'Condition';
  code: CodeableConcept;
  clinicalStatus: ClinicalStatus;
  /** When the condition was recorded/known to the patient. */
  onsetDate?: DateString;
  note?: string;
}

export type MedicationStatementStatus = 'active' | 'completed' | 'stopped';

/** FHIR `MedicationStatement` — a medication the patient takes (RxNorm/ATC). */
export interface MedicationStatement extends ResourceBase {
  resourceType: 'MedicationStatement';
  medication: CodeableConcept;
  status: MedicationStatementStatus;
  /** Free-text dosage as the patient understands it (e.g. "500 mg twice daily"). */
  dosageText?: string;
  effectiveStart?: DateString;
  note?: string;
}

export type AllergyCriticality = 'low' | 'high' | 'unable-to-assess';

/** FHIR `AllergyIntolerance` — an allergy/intolerance (SNOMED/RxNorm). */
export interface AllergyIntolerance extends ResourceBase {
  resourceType: 'AllergyIntolerance';
  code: CodeableConcept;
  criticality?: AllergyCriticality;
  /** Patient-described reaction, e.g. "rash", "anaphylaxis". */
  reaction?: string;
  note?: string;
}

/** The discriminated union of everything stored in the record. */
export type HealthResource =
  | Patient
  | Observation
  | Condition
  | MedicationStatement
  | AllergyIntolerance;

export type ResourceType = HealthResource['resourceType'];

/** Narrow a resource union by its type discriminator. */
export type ResourceOf<T extends ResourceType> = Extract<
  HealthResource,
  { resourceType: T }
>;
