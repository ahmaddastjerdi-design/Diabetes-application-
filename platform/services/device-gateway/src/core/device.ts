/**
 * device.ts — device registration → FHIR Device (Vol 5 §device management).
 * Read-only ingest: we register a device to attribute observations and capture firmware,
 * never to control therapy. Pure mapping so it is unit-testable.
 */
import type { Coding } from "@diabetes-quest/shared";

export type DeviceType = "cgm" | "bgm" | "blood-pressure" | "scale" | "pulse-oximeter";

export interface DeviceRegistration {
  deviceId: string;
  patientId: string;
  type: DeviceType;
  manufacturer: string;
  model: string;
  firmware?: string;
}

export interface FhirDevice {
  resourceType: "Device";
  identifier: { system: string; value: string }[];
  status: "active";
  manufacturer: string;
  deviceName: { name: string; type: "model-name" }[];
  version?: { value: string }[];
  type: { coding: Coding[] };
  patient: { reference: string };
}

const SNOMED = "http://snomed.info/sct";
const TYPE_CODING: Record<DeviceType, Coding> = {
  cgm: { system: SNOMED, code: "709586007", display: "Continuous glucose monitoring system" },
  bgm: { system: SNOMED, code: "337414009", display: "Blood glucose meter" },
  "blood-pressure": { system: SNOMED, code: "466086007", display: "Blood pressure monitor" },
  scale: { system: SNOMED, code: "5042004", display: "Weighing scale" },
  "pulse-oximeter": { system: SNOMED, code: "448703006", display: "Pulse oximeter" },
};

export function toFhirDevice(reg: DeviceRegistration): FhirDevice {
  return {
    resourceType: "Device",
    identifier: [{ system: "urn:diabetes-quest:device", value: reg.deviceId }],
    status: "active",
    manufacturer: reg.manufacturer,
    deviceName: [{ name: reg.model, type: "model-name" }],
    ...(reg.firmware ? { version: [{ value: reg.firmware }] } : {}),
    type: { coding: [TYPE_CODING[reg.type]] },
    patient: { reference: `Patient/${reg.patientId}` },
  };
}

/**
 * Gate before a new device model may be enabled in production (Vol 5 §certification).
 * A device must pass every item; this is asserted in tests and surfaced in ops.
 */
export const CERTIFICATION_CHECKLIST: readonly string[] = [
  "units verified against a reference meter",
  "timezone/DST handling validated",
  "duplicate/replay readings deduplicated by identifier",
  "out-of-range and error sentinels filtered",
  "BLE pairing/bonding security reviewed (Vol 8)",
  "data-origin priority configured (Vol 5)",
];
