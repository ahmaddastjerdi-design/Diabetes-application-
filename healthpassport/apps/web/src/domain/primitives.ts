// FHIR R4-aligned primitive data types (a pragmatic subset).
// See docs/INTEROPERABILITY.md and ADR-0003.

/** Terminology systems we reference, as canonical URLs (FHIR convention). */
export const SYSTEMS = {
  LOINC: 'http://loinc.org',
  SNOMED: 'http://snomed.info/sct',
  ICD10: 'http://hl7.org/fhir/sid/icd-10',
  RXNORM: 'http://www.nlm.nih.gov/research/umls/rxnorm',
  ATC: 'http://www.whocc.no/atc',
  UCUM: 'http://unitsofmeasure.org',
  CVX: 'http://hl7.org/fhir/sid/cvx',
} as const;

export type CodeSystem = (typeof SYSTEMS)[keyof typeof SYSTEMS];

/** A single coded value from a terminology system (FHIR `Coding`). */
export interface Coding {
  system: CodeSystem;
  code: string;
  display: string;
}

/** A concept, optionally expressed with multiple codings (FHIR `CodeableConcept`). */
export interface CodeableConcept {
  coding: Coding[];
  /** Plain-text fallback shown to the user. */
  text: string;
}

/** A measured amount with a UCUM unit (FHIR `Quantity`). */
export interface Quantity {
  value: number;
  /** Human-readable unit, e.g. "mg/dL". */
  unit: string;
  /** UCUM code, e.g. "mg/dL". */
  code: string;
  system: typeof SYSTEMS.UCUM;
}

/** ISO-8601 instant string (e.g. "2026-07-09T08:00:00.000Z"). */
export type Instant = string;
/** ISO-8601 date string (e.g. "1980-05-01"). */
export type DateString = string;

export type AdministrativeGender = 'male' | 'female' | 'other' | 'unknown';

/** Convenience constructor for a single-coding concept. */
export function concept(coding: Coding, text?: string): CodeableConcept {
  return { coding: [coding], text: text ?? coding.display };
}

/** Convenience constructor for a UCUM quantity. */
export function quantity(value: number, unit: string, code: string): Quantity {
  return { value, unit, code, system: SYSTEMS.UCUM };
}
