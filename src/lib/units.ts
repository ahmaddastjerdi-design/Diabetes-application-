/**
 * units.ts — glucose unit handling (PRD Vol 2: localization / units mg/dL ↔ mmol/L).
 * Pure; used by MarkerRow and Settings. Conversion factor is exact.
 */
import { MarkerDef } from "../engine/physiology";

export type GlucoseUnit = "mg/dL" | "mmol/L";

export const MG_DL_PER_MMOL_L = 18.0182;
export const mgdlToMmol = (v: number): number => v / MG_DL_PER_MMOL_L;
export const mmolToMgdl = (v: number): number => v * MG_DL_PER_MMOL_L;

export interface FormattedMarker {
  value: string;
  unit: string;
  low: string;
  high: string;
}

/** Format a marker for display, converting glucose to the user's preferred unit. */
export function formatMarker(def: MarkerDef, value: number, glucoseUnit: GlucoseUnit): FormattedMarker {
  if (def.key === "glucose" && glucoseUnit === "mmol/L") {
    return {
      value: mgdlToMmol(value).toFixed(1),
      unit: "mmol/L",
      low: mgdlToMmol(def.healthy[0]).toFixed(1),
      high: mgdlToMmol(def.healthy[1]).toFixed(1),
    };
  }
  return {
    value: String(Math.round(value)),
    unit: def.unit,
    low: String(def.healthy[0]),
    high: String(def.healthy[1]),
  };
}
