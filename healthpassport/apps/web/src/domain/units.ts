// Pure, unit-tested unit conversions. Stored values keep their original unit +
// UCUM code (lossless); these convert only for display/comparison.

/** Molar mass factor for glucose: 1 mmol/L = 18.0182 mg/dL. */
const GLUCOSE_MGDL_PER_MMOL = 18.0182;
/** Molar mass factor for LDL cholesterol: 1 mmol/L = 38.67 mg/dL. */
const CHOL_MGDL_PER_MMOL = 38.67;
const LB_PER_KG = 2.2046226218;

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

export function glucoseMgdlToMmol(mgdl: number): number {
  return round(mgdl / GLUCOSE_MGDL_PER_MMOL, 1);
}
export function glucoseMmolToMgdl(mmol: number): number {
  return round(mmol * GLUCOSE_MGDL_PER_MMOL, 0);
}

export function cholMgdlToMmol(mgdl: number): number {
  return round(mgdl / CHOL_MGDL_PER_MMOL, 2);
}
export function cholMmolToMgdl(mmol: number): number {
  return round(mmol * CHOL_MGDL_PER_MMOL, 0);
}

export function kgToLb(kg: number): number {
  return round(kg * LB_PER_KG, 1);
}
export function lbToKg(lb: number): number {
  return round(lb / LB_PER_KG, 1);
}

export function celsiusToFahrenheit(c: number): number {
  return round((c * 9) / 5 + 32, 1);
}
export function fahrenheitToCelsius(f: number): number {
  return round(((f - 32) * 5) / 9, 1);
}

/**
 * Estimated HbA1c (%) from average glucose using the ADAG formula
 * eAG(mg/dL) = 28.7 × A1c − 46.7  ⟺  A1c = (avg + 46.7) / 28.7.
 * This is a SIMPLIFIED derived indicator (see docs/CLINICAL_SAFETY.md §7),
 * never a substitute for a lab HbA1c.
 */
export function estimatedA1cFromAvgGlucoseMgdl(avgMgdl: number): number {
  return round((avgMgdl + 46.7) / 28.7, 1);
}
