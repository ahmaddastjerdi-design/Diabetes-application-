/**
 * connectors.ts — normalise per-source device payloads into our `RawMeasurement`
 * (Vol 5 §channels). Pure transforms: Health Connect (Android), Dexcom EGV (vendor
 * cloud). Each source is shaped differently; we converge them on one internal type so
 * the rest of the pipeline (mapping → queue → forward) is source-agnostic.
 */
import type { RawMeasurement, MeasurementKind } from "./mapping.js";

/** Minimal shape of an Android Health Connect record we care about (Vol 5). */
export interface HealthConnectRecord {
  recordType: "BloodGlucose" | "BloodPressure" | "Weight" | "OxygenSaturation" | "HeartRate";
  time: string; // ISO 8601
  value: number;
  unit: string;
  dataOrigin: string; // source app package, e.g. "com.dexcom.g7"
}

const HC_KIND: Record<HealthConnectRecord["recordType"], MeasurementKind> = {
  BloodGlucose: "cgm",
  BloodPressure: "systolic",
  Weight: "weight",
  OxygenSaturation: "spo2",
  HeartRate: "heartRate",
};

export function fromHealthConnect(rec: HealthConnectRecord, patientId: string): RawMeasurement {
  return {
    kind: HC_KIND[rec.recordType],
    value: rec.value,
    unit: rec.unit,
    takenAtMs: Date.parse(rec.time),
    patientId,
    deviceId: rec.dataOrigin, // the originating app/device package
  };
}

/** A Dexcom EGV (estimated glucose value) sample from the vendor cloud API. */
export interface DexcomEgv {
  systemTime: string; // ISO 8601 (UTC)
  value: number; // mg/dL
  transmitterId: string;
}

export function fromDexcomEgv(egv: DexcomEgv, patientId: string): RawMeasurement {
  return {
    kind: "cgm",
    value: egv.value,
    unit: "mg/dL",
    takenAtMs: Date.parse(egv.systemTime),
    patientId,
    deviceId: `dexcom:${egv.transmitterId}`,
  };
}

/**
 * Cross-origin dedup (Vol 5 §data-origin priority). The same reading can arrive from
 * both Health Connect and the vendor cloud; keep the higher-priority source per logical
 * reading (patient + kind + timestamp). `priority` lists origins best-first; a
 * prefix match (e.g. "dexcom") wins over an exact later one.
 */
export function preferByOrigin(records: readonly RawMeasurement[], priority: readonly string[]): RawMeasurement[] {
  const rank = (deviceId: string): number => {
    const i = priority.findIndex((p) => deviceId.startsWith(p));
    return i === -1 ? priority.length : i;
  };
  const best = new Map<string, RawMeasurement>();
  for (const r of records) {
    const key = `${r.patientId}|${r.kind}|${r.takenAtMs}`;
    const current = best.get(key);
    if (!current || rank(r.deviceId) < rank(current.deviceId)) best.set(key, r);
  }
  return [...best.values()];
}
