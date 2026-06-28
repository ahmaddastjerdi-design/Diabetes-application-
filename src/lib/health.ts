/**
 * health.ts — device catalog, reading validation, and reminder slots (PRD Vol 2 / Vol 5).
 * Pure logic shared by the Devices and Settings screens; verified by the engine smoke check.
 */
import { GlucoseUnit, mmolToMgdl } from "./units";

export type DeviceKind = "cgm" | "bgm" | "bp" | "scale";

export interface DeviceCatalogEntry {
  kind: DeviceKind;
  label: string;
  emoji: string;
  blurb: string;
}

export const DEVICE_CATALOG: DeviceCatalogEntry[] = [
  { kind: "cgm", label: "Continuous glucose monitor", emoji: "📈", blurb: "Streams glucose continuously (e.g. Dexcom, Libre)." },
  { kind: "bgm", label: "Blood glucose meter", emoji: "🩸", blurb: "Finger-stick glucose readings." },
  { kind: "bp", label: "Blood pressure monitor", emoji: "💓", blurb: "Systolic / diastolic readings." },
  { kind: "scale", label: "Smart scale", emoji: "⚖️", blurb: "Weight and body composition." },
];

export interface ReadingValidation {
  ok: boolean;
  mgdl: number;
  error?: string;
}

/** Validate + normalise a manually-entered glucose reading to mg/dL. */
export function validateGlucoseReading(value: number, unit: GlucoseUnit): ReadingValidation {
  if (!Number.isFinite(value)) return { ok: false, mgdl: 0, error: "Enter a number." };
  const mgdl = unit === "mmol/L" ? Math.round(mmolToMgdl(value)) : Math.round(value);
  if (mgdl < 20 || mgdl > 600) return { ok: false, mgdl, error: "That reading looks out of range." };
  return { ok: true, mgdl };
}

export type GlucoseClass = "low" | "in-range" | "high";

/** Classify a glucose reading using the consensus 70–180 mg/dL target range. */
export function classifyGlucose(mgdl: number): GlucoseClass {
  if (mgdl < 70) return "low";
  if (mgdl > 180) return "high";
  return "in-range";
}

export interface ReminderSlot {
  id: string;
  label: string;
  time: string; // HH:MM, local
}

export const REMINDER_SLOTS: ReminderSlot[] = [
  { id: "morning", label: "Morning", time: "08:00" },
  { id: "midday", label: "Midday", time: "12:30" },
  { id: "evening", label: "Evening", time: "18:00" },
  { id: "night", label: "Night", time: "21:30" },
];
