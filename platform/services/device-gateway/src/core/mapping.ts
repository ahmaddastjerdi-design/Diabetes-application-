/**
 * mapping.ts — normalise a raw device measurement into a FHIR Observation (Vol 5).
 *
 * Pure functions: units normalisation + LOINC coding + a deterministic identifier for
 * the dedup/idempotency contract shared with the backend (Vol 4). No therapy control —
 * ingest is read-only by design.
 */
import { LOINC, type Coding, type Observation } from "@diabetes-quest/shared";

export type MeasurementKind = "glucose" | "cgm" | "systolic" | "diastolic" | "weight" | "spo2" | "heartRate";

export interface RawMeasurement {
  kind: MeasurementKind;
  value: number;
  unit: string; // as reported by the device; normalised below
  /** Epoch milliseconds (UTC) of the reading. */
  takenAtMs: number;
  patientId: string;
  deviceId: string;
}

const CODING: Record<MeasurementKind, Coding> = {
  glucose: LOINC.glucoseMass,
  cgm: LOINC.glucoseCgmMean,
  systolic: LOINC.systolic,
  diastolic: LOINC.diastolic,
  weight: LOINC.bodyWeight,
  spo2: LOINC.spo2,
  heartRate: LOINC.heartRate,
};

/** Canonical unit per kind; values are converted into these (Vol 5 §normalisation). */
const CANONICAL_UNIT: Record<MeasurementKind, string> = {
  glucose: "mg/dL",
  cgm: "mg/dL",
  systolic: "mmHg",
  diastolic: "mmHg",
  weight: "kg",
  spo2: "%",
  heartRate: "/min",
};

function normaliseValue(kind: MeasurementKind, value: number, unit: string): number {
  const u = unit.toLowerCase();
  if ((kind === "glucose" || kind === "cgm") && (u === "mmol/l" || u === "mmol")) {
    return Math.round(value * 18.0182); // mmol/L -> mg/dL
  }
  if (kind === "weight" && (u === "lb" || u === "lbs")) {
    return Math.round(value * 0.453592 * 10) / 10; // lb -> kg
  }
  return value;
}

/** A stable idempotency identifier matching the backend's dedup expectation (Vol 4/5). */
export function measurementIdentifier(m: RawMeasurement): { system: string; value: string } {
  return {
    system: "urn:diabetes-quest:device-measurement",
    value: `${m.deviceId}:${m.kind}:${m.takenAtMs}`,
  };
}

export function toObservation(m: RawMeasurement): Observation {
  return {
    resourceType: "Observation",
    status: "final",
    code: { coding: [CODING[m.kind]] },
    subject: { reference: `Patient/${m.patientId}` },
    device: { reference: `Device/${m.deviceId}` },
    effectiveDateTime: new Date(m.takenAtMs).toISOString(),
    valueQuantity: {
      value: normaliseValue(m.kind, m.value, m.unit),
      unit: CANONICAL_UNIT[m.kind],
      system: "http://unitsofmeasure.org",
    },
    identifier: [measurementIdentifier(m)],
  };
}
