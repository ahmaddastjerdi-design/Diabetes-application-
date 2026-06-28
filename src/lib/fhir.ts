/**
 * fhir.ts — app-side FHIR Observation mapping (PRD Vol 2 / Vol 5).
 * A minimal mirror of the platform's `@diabetes-quest/shared` Observation contract (the
 * standalone Expo app isn't in that workspace). Glucose readings become FHIR Observations
 * the backend persists and the clinician panel / AI coach consume.
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

/** LOINC: Glucose [Mass/volume] in Blood. */
const LOINC_GLUCOSE = { system: "http://loinc.org", code: "2339-0", display: "Glucose [Mass/volume] in Blood" };

export interface ReadingLike {
  id: string;
  mgdl: number;
  atMs: number;
}

export function readingToObservation(r: ReadingLike, patientId: string): Observation {
  return {
    resourceType: "Observation",
    status: "final",
    code: { coding: [LOINC_GLUCOSE] },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: new Date(r.atMs).toISOString(),
    valueQuantity: { value: r.mgdl, unit: "mg/dL", system: "http://unitsofmeasure.org" },
    // Stable identifier → the backend dedupes, so re-pushing the same reading is safe.
    identifier: [{ system: "urn:diabetes-quest:app-reading", value: r.id }],
  };
}
