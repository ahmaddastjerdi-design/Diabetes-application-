/**
 * fhir.ts — the platform's FHIR R4 contract surface (Vol 4 §FHIR, Vol 5 device codes).
 *
 * Minimal, intentionally narrow type aliases over the FHIR R4 resources the platform
 * actually uses, plus the LOINC/coding constants shared between the device-gateway
 * (ingest) and the backend/clinician panel (display & reporting). This is NOT a full
 * FHIR implementation — it is the agreed shape so producers and consumers match.
 */

/** FHIR resource types the platform reads or writes. See Vol 4 traceability. */
export type FhirResourceType =
  | "Patient"
  | "Practitioner"
  | "CareTeam"
  | "Observation"
  | "Device"
  | "Consent"
  | "DiagnosticReport"
  | "DocumentReference";

export interface Coding {
  system: string;
  code: string;
  display?: string;
}

/** LOINC codes for the measurements the device-gateway ingests (Vol 5). */
export const LOINC = {
  glucoseMass: { system: "http://loinc.org", code: "2339-0", display: "Glucose [Mass/volume] in Blood" },
  glucoseCgmMean: { system: "http://loinc.org", code: "97507-8", display: "Glucose mean [Mass/volume] in Interstitial fluid" },
  systolic: { system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" },
  diastolic: { system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" },
  bodyWeight: { system: "http://loinc.org", code: "29463-7", display: "Body weight" },
  spo2: { system: "http://loinc.org", code: "59408-5", display: "Oxygen saturation in Arterial blood by Pulse oximetry" },
  heartRate: { system: "http://loinc.org", code: "8867-4", display: "Heart rate" },
  ldl: { system: "http://loinc.org", code: "13457-7", display: "LDL cholesterol (calculated)" },
} as const satisfies Record<string, Coding>;

export interface Reference {
  /** e.g. "Patient/123" */
  reference: string;
  display?: string;
}

export interface Quantity {
  value: number;
  unit: string;
  system?: "http://unitsofmeasure.org";
  code?: string;
}

/** Narrowed FHIR Observation as produced by device ingest / app sync (Vol 4/5). */
export interface Observation {
  resourceType: "Observation";
  id?: string;
  status: "registered" | "preliminary" | "final" | "amended";
  code: { coding: Coding[] };
  subject: Reference;
  device?: Reference;
  effectiveDateTime: string; // ISO 8601 (UTC); see Vol 5 timezone handling
  valueQuantity: Quantity;
  /** Idempotency key for the offline sync contract (Vol 4 §sync, Vol 5 §queue). */
  identifier?: { system: string; value: string }[];
}
