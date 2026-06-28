/**
 * markers.ts — the platform's canonical marker & organ contract.
 *
 * This is the SHARED source of truth for the physiological markers and organs the
 * whole platform reasons about. It mirrors the prototype engine in
 * `../../../../src/engine/physiology.ts` and is the contract that the mobile app,
 * backend (Vol 4), device-gateway (Vol 5), and AI coach (Vol 6) all import so the
 * model cannot drift between them.
 *
 * NOTE: values here describe the EDUCATIONAL SIMULATION's bands. Real clinical
 * thresholds (e.g. CGM time-in-range targets) live in clinical config, not here, and
 * are owned by the backend/clinician domains — never conflate the two (see Vol 3, Vol 6).
 */

export type MarkerKey = "glucose" | "systolic" | "hydration" | "ldl";
export type OrganKey = "heart" | "kidney";

/** A physiological marker with a healthy target band and plausibility clamp. */
export interface MarkerDef {
  key: MarkerKey;
  label: string;
  unit: string;
  /** Healthy range [low, high]; inside heals organs, outside harms them. */
  healthy: readonly [number, number];
  /** Hard clamp so simulated values stay plausible. */
  clamp: readonly [number, number];
  /** Untreated daily starting point (sits slightly outside the healthy band). */
  baseline: number;
}

export const MARKERS: Readonly<Record<MarkerKey, MarkerDef>> = {
  glucose: { key: "glucose", label: "Blood glucose", unit: "mg/dL", healthy: [80, 140], clamp: [60, 320], baseline: 150 },
  systolic: { key: "systolic", label: "Blood pressure", unit: "mmHg", healthy: [100, 130], clamp: [85, 200], baseline: 135 },
  hydration: { key: "hydration", label: "Hydration", unit: "%", healthy: [60, 100], clamp: [10, 100], baseline: 55 },
  ldl: { key: "ldl", label: "LDL cholesterol", unit: "mg/dL", healthy: [40, 100], clamp: [40, 240], baseline: 108 },
} as const;

export interface OrganDef {
  key: OrganKey;
  label: string;
  /** Per-marker sensitivity: how strongly an out-of-band marker damages this organ. */
  sensitivity: Partial<Record<MarkerKey, number>>;
}

export const ORGANS: Readonly<Record<OrganKey, OrganDef>> = {
  heart: { key: "heart", label: "Heart", sensitivity: { systolic: 1.0, ldl: 0.8, glucose: 0.5 } },
  kidney: { key: "kidney", label: "Kidneys", sensitivity: { glucose: 1.0, systolic: 0.9, hydration: 0.6 } },
} as const;

/**
 * Glucose unit conversion. The mobile app and clinician panel must both render
 * mg/dL and mmol/L (Vol 7 i18n, Vol 9 medical-workflow tests). Factor is exact.
 */
export const MG_DL_PER_MMOL_L = 18.0182;
export const mgdlToMmol = (mgdl: number): number => mgdl / MG_DL_PER_MMOL_L;
export const mmolToMgdl = (mmol: number): number => mmol * MG_DL_PER_MMOL_L;
