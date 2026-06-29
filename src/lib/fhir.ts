/**
 * fhir.ts — app-side FHIR Observation mapping (PRD Vol 2 / Vol 5).
 * A minimal mirror of the platform's `@diabetes-quest/shared` Observation contract.
 * Glucose and blood-pressure readings become FHIR Observations the backend persists and
 * the clinician panel / AI coach consume.
 */
export interface Observation {
  resourceType: "Observation";
  status: "final";
  code: { coding: { system: string; code: string; display?: string }[] };
  subject: { reference: string };
  effectiveDateTime: string; // ISO 8601 (UTC)
  valueQuantity: { value: number; unit: string; system?: string };
  identifier?: { system: string; value: string }[];
}

// LOINC codes
const LOINC_GLUCOSE = { system: "http://loinc.org", code: "2339-0", display: "Glucose [Mass/volume] in Blood" };
const LOINC_SYSTOLIC = { system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" };
const LOINC_DIASTOLIC = { system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" };
const UCUM = "http://unitsofmeasure.org";

export interface ReadingLike {
  id: string;
  atMs: number;
  kind?: "glucose" | "bp";
  mgdl?: number;
  systolic?: number;
  diastolic?: number;
}

function obs(
  patientId: string,
  atMs: number,
  coding: { system: string; code: string; display?: string },
  value: number,
  unit: string,
  idValue: string
): Observation {
  return {
    resourceType: "Observation",
    status: "final",
    code: { coding: [coding] },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: new Date(atMs).toISOString(),
    valueQuantity: { value, unit, system: UCUM },
    identifier: [{ system: "urn:diabetes-quest:app-reading", value: idValue }],
  };
}

/** A single glucose reading → one Observation (kept for existing callers/tests). */
export function readingToObservation(r: ReadingLike, patientId: string): Observation {
  return obs(patientId, r.atMs, LOINC_GLUCOSE, r.mgdl ?? 0, "mg/dL", r.id);
}

/** A lab/body metric value → a FHIR Observation using the metric's LOINC code. */
export function metricObservation(patientId: string, loinc: string, unit: string, value: number, atMs: number, id: string): Observation {
  return obs(patientId, atMs, { system: "http://loinc.org", code: loinc }, value, unit, id);
}

/** Any reading → its FHIR Observation(s). Blood pressure yields systolic + diastolic. */
export function readingToObservations(r: ReadingLike, patientId: string): Observation[] {
  if (r.kind === "bp" && r.systolic != null && r.diastolic != null) {
    return [
      obs(patientId, r.atMs, LOINC_SYSTOLIC, r.systolic, "mmHg", `${r.id}-sys`),
      obs(patientId, r.atMs, LOINC_DIASTOLIC, r.diastolic, "mmHg", `${r.id}-dia`),
    ];
  }
  if (r.mgdl != null) return [obs(patientId, r.atMs, LOINC_GLUCOSE, r.mgdl, "mg/dL", r.id)];
  return [];
}
