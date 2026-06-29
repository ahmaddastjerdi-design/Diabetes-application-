/**
 * ada.ts — ADA Standards of Care alignment for the patient app.
 *
 * Encodes the well-established targets from the American Diabetes Association
 * "Standards of Care in Diabetes" and the ADA/international CGM consensus
 * (time-in-range, hypoglycemia levels, GMI), plus blood-pressure and lifestyle goals.
 *
 * IMPORTANT — clinical safety:
 *  - Targets are GENERAL and must be INDIVIDUALIZED by the patient's own clinician.
 *  - This is educational self-management support, NOT medical advice or a medical device.
 *  - Confirm every value against the CURRENT ADA Standards of Care edition; guidelines
 *    are updated annually. This module reflects widely-published targets, not a live read
 *    of the latest document, and has not been clinically validated.
 */

export const ADA_SOURCE =
  "Targets reflect the ADA Standards of Care in Diabetes and the international CGM consensus. " +
  "They are general and must be individualized and confirmed by your clinician against the current edition.";

// --- Glycemia: hypoglycemia levels + the target range (mg/dL) ---

export type GlucoseLevel = "level2" | "level1" | "inRange" | "high" | "veryHigh";

/** ADA hypoglycemia levels + target range. Level 2 (<54) is clinically significant. */
export function classifyGlucoseLevel(mgdl: number): GlucoseLevel {
  if (mgdl < 54) return "level2"; // Level 2 hypoglycemia — clinically significant
  if (mgdl < 70) return "level1"; // Level 1 hypoglycemia — alert value
  if (mgdl <= 180) return "inRange"; // target range 70–180 mg/dL
  if (mgdl <= 250) return "high";
  return "veryHigh";
}

export const GLUCOSE_LEVEL: Record<GlucoseLevel, { label: string; urgent: boolean }> = {
  level2: { label: "Very low (<54)", urgent: true },
  level1: { label: "Low (54–69)", urgent: false },
  inRange: { label: "In range (70–180)", urgent: false },
  high: { label: "High (181–250)", urgent: false },
  veryHigh: { label: "Very high (>250)", urgent: true },
};

/** Glucose Management Indicator (estimated A1C), Bergenstal 2018: 3.31 + 0.02392 × mean. */
export function gmiPercent(meanMgdl: number): number {
  return Math.round((3.31 + 0.02392 * meanMgdl) * 10) / 10;
}

// --- The headline targets shown to the patient ---

export interface ClinicalTarget {
  key: string;
  label: string;
  target: string;
  note?: string;
}

export const ADA_TARGETS: ClinicalTarget[] = [
  { key: "a1c", label: "A1C (≈3-month average)", target: "< 7.0%", note: "Individualized; less strict for some." },
  { key: "tir", label: "Time in range 70–180 mg/dL", target: "> 70% of the day" },
  { key: "tbr70", label: "Time below 70 mg/dL", target: "< 4%" },
  { key: "tbr54", label: "Time below 54 mg/dL", target: "< 1%" },
  { key: "tar180", label: "Time above 180 mg/dL", target: "< 25%" },
  { key: "bp", label: "Blood pressure", target: "< 130/80 mmHg" },
  { key: "activity", label: "Physical activity", target: "≥ 150 min/week moderate" },
  { key: "lipids", label: "Cholesterol (LDL)", target: "Statin per risk; lower is better" },
];

/** Annual/periodic screenings the ADA recommends (educational reminder list). */
export const ADA_SCREENINGS: string[] = [
  "Dilated eye exam (retinopathy) — at least yearly",
  "Urine albumin + eGFR (kidney) — yearly",
  "Foot exam (neuropathy / circulation) — yearly",
  "Lipid panel — periodically per your clinician",
];
