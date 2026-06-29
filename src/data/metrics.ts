/**
 * metrics.ts — catalog of trackable health measurements beyond glucose & blood pressure.
 * Lab values and body metrics, each with a unit, a healthy/target range (for chart
 * colouring) and a LOINC code so the value can be synced to the care team as FHIR.
 *
 * Ranges are GENERAL adult references for orientation only — your own targets are set by
 * your clinician, and lab reference ranges vary by laboratory. LOINC codes are common
 * choices; confirm against your lab report.
 */
export interface MetricDef {
  key: string;
  label: string;
  unit: string;
  /** LOINC code for FHIR sync (common choice; verify with your lab). */
  loinc?: string;
  /** Healthy/target range [low, high] used to colour charts. */
  target?: [number, number];
  category: "glycemic" | "lipids" | "renal" | "cardiac" | "body";
  decimals?: number;
}

export const METRICS: MetricDef[] = [
  { key: "hba1c", label: "HbA1c", unit: "%", loinc: "4548-4", target: [4, 7], category: "glycemic", decimals: 1 },

  { key: "chol_total", label: "Total cholesterol", unit: "mg/dL", loinc: "2093-3", target: [0, 200], category: "lipids" },
  { key: "ldl", label: "LDL cholesterol", unit: "mg/dL", loinc: "13457-7", target: [0, 100], category: "lipids" },
  { key: "hdl", label: "HDL cholesterol", unit: "mg/dL", loinc: "2085-9", target: [40, 100], category: "lipids" },
  { key: "triglycerides", label: "Triglycerides", unit: "mg/dL", loinc: "2571-8", target: [0, 150], category: "lipids" },

  { key: "bun", label: "BUN (urea nitrogen)", unit: "mg/dL", loinc: "3094-0", target: [7, 20], category: "renal" },
  { key: "creatinine", label: "Serum creatinine", unit: "mg/dL", loinc: "2160-0", target: [0.6, 1.3], category: "renal", decimals: 2 },
  { key: "urine_creatinine", label: "Urine creatinine", unit: "mg/dL", loinc: "2161-8", category: "renal" },
  { key: "uacr", label: "Urine albumin/creatinine (UACR)", unit: "mg/g", loinc: "9318-7", target: [0, 30], category: "renal" },
  { key: "egfr", label: "eGFR", unit: "mL/min/1.73m²", loinc: "62238-1", target: [60, 120], category: "renal" },

  { key: "probnp", label: "NT-proBNP", unit: "pg/mL", loinc: "33762-6", target: [0, 125], category: "cardiac" },

  { key: "weight", label: "Weight", unit: "kg", loinc: "29463-7", category: "body", decimals: 1 },
  { key: "height", label: "Height", unit: "cm", loinc: "8302-2", category: "body" },
];

export function getMetric(key: string): MetricDef | undefined {
  return METRICS.find((m) => m.key === key);
}

/** Body Mass Index from weight (kg) and height (cm). */
export function bmi(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiCategory(value: number): string {
  if (value < 18.5) return "Underweight";
  if (value < 25) return "Healthy";
  if (value < 30) return "Overweight";
  return "Obese";
}

export const METRICS_DISCLAIMER =
  "Reference ranges are general and vary by laboratory; your targets are set by your clinician. " +
  "Educational only — not a diagnosis.";
