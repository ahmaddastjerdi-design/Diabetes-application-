// Red-flag rules engine. Thresholds are cited (see docs/CLINICAL_REFERENCE.md and
// docs/MEDICAL_SAFETY_RULES.md) and pending Clinical Safety Officer sign-off.
// This layer CLASSIFIES and ESCALATES — it never diagnoses.

export type Disposition = 'EMERGENCY' | 'URGENT' | 'ROUTINE';

const RANK: Record<Disposition, number> = { EMERGENCY: 3, URGENT: 2, ROUTINE: 1 };

export interface Finding {
  disposition: Exclude<Disposition, 'ROUTINE'>;
  code: string;
  detail: string;
  citation: string;
}

export interface Evaluation {
  disposition: Disposition;
  findings: Finding[];
}

export function evaluationOf(findings: Finding[]): Evaluation {
  const disposition = findings.reduce<Disposition>(
    (worst, f) => (RANK[f.disposition] > RANK[worst] ? f.disposition : worst),
    'ROUTINE',
  );
  return { disposition, findings };
}

// ── Unit conversions (canonical units for evaluation) ──
export const GLUCOSE_MGDL_PER_MMOL = 18.0182;
export function glucoseToMgdl(value: number, unit: string): number {
  return unit === 'mmol/L' ? value * GLUCOSE_MGDL_PER_MMOL : value;
}
export function tempToCelsius(value: number, unit: string): number {
  return unit === '°F' || unit === 'F' ? ((value - 32) * 5) / 9 : value;
}

// ── Vital classification ──
export function classifyGlucose(value: number, unit: string): Finding[] {
  const mgdl = glucoseToMgdl(value, unit);
  if (mgdl < 54)
    return [{ disposition: 'EMERGENCY', code: 'severe-hypoglycemia', detail: `Blood glucose ${value} ${unit} is very low and can be dangerous.`, citation: 'ADA — Level 2 hypoglycemia (<54 mg/dL / <3.0 mmol/L)' }];
  if (mgdl < 70)
    return [{ disposition: 'URGENT', code: 'hypoglycemia', detail: `Blood glucose ${value} ${unit} is low. Treat it and recheck.`, citation: 'ADA — Level 1 hypoglycemia (<70 mg/dL / <3.9 mmol/L)' }];
  if (mgdl >= 400)
    return [{ disposition: 'EMERGENCY', code: 'severe-hyperglycemia', detail: `Blood glucose ${value} ${unit} is very high; this can signal an emergency.`, citation: 'Severe hyperglycemia / DKA-HHS risk threshold (app safety choice)' }];
  if (mgdl > 250)
    return [{ disposition: 'URGENT', code: 'marked-hyperglycemia', detail: `Blood glucose ${value} ${unit} is high. If this persists, contact your care team.`, citation: 'Marked hyperglycemia threshold' }];
  return [];
}

export function classifyBloodPressure(systolic: number, diastolic: number): Finding[] {
  if (systolic >= 180 || diastolic >= 120)
    return [{ disposition: 'URGENT', code: 'hypertensive-crisis-range', detail: `Blood pressure ${systolic}/${diastolic} mmHg is very high. Rest and recheck; if it stays this high or you feel unwell, seek care now.`, citation: 'ACC/AHA 2017 — hypertensive crisis (≥180 and/or ≥120 mmHg)' }];
  if (systolic < 80)
    return [{ disposition: 'URGENT', code: 'hypotension', detail: `Systolic pressure ${systolic} mmHg is low. If you feel dizzy or unwell, contact your care team.`, citation: 'Low systolic blood pressure threshold' }];
  return [];
}

export function classifySpo2(value: number): Finding[] {
  if (value < 88)
    return [{ disposition: 'EMERGENCY', code: 'severe-hypoxemia', detail: `Oxygen saturation ${value}% is very low.`, citation: 'Severe hypoxemia threshold' }];
  if (value < 92)
    return [{ disposition: 'URGENT', code: 'hypoxemia', detail: `Oxygen saturation ${value}% is low. If you are breathless, seek care.`, citation: 'Low SpO₂ threshold (app choice; WHO hypoxemia <90%)' }];
  return [];
}

export function classifyHeartRate(value: number): Finding[] {
  if (value >= 131)
    return [{ disposition: 'URGENT', code: 'tachycardia', detail: `Resting heart rate ${value} bpm is high. If it persists or you feel unwell, seek care.`, citation: 'NEWS2 high-range heart rate (≥131/min)' }];
  if (value <= 40)
    return [{ disposition: 'URGENT', code: 'bradycardia', detail: `Resting heart rate ${value} bpm is low. If you feel faint, seek care.`, citation: 'NEWS2 low-range heart rate (≤40/min)' }];
  return [];
}

export function classifyTemperature(value: number, unit: string): Finding[] {
  const c = tempToCelsius(value, unit);
  if (c >= 41)
    return [{ disposition: 'EMERGENCY', code: 'hyperpyrexia', detail: `Temperature ${value} ${unit} is dangerously high.`, citation: 'Hyperpyrexia (≥41 °C)' }];
  if (c < 35)
    return [{ disposition: 'URGENT', code: 'hypothermia', detail: `Temperature ${value} ${unit} is low (hypothermia range).`, citation: 'Hypothermia (<35 °C)' }];
  return [];
}

// ── Lab classification ──
export function classifyPotassium(value: number): Finding[] {
  if (value >= 6.5)
    return [{ disposition: 'EMERGENCY', code: 'severe-hyperkalemia', detail: `Potassium ${value} mmol/L is severely high.`, citation: 'Severe hyperkalemia (≥6.5 mmol/L, conservative ERC band)' }];
  if (value >= 6.0)
    return [{ disposition: 'URGENT', code: 'hyperkalemia', detail: `Potassium ${value} mmol/L is high. Contact your care team.`, citation: 'Hyperkalemia threshold' }];
  if (value <= 2.5)
    return [{ disposition: 'URGENT', code: 'hypokalemia', detail: `Potassium ${value} mmol/L is low. Contact your care team.`, citation: 'Severe hypokalemia threshold' }];
  return [];
}

export function classifyEgfr(value: number): Finding[] {
  if (value < 15)
    return [{ disposition: 'URGENT', code: 'kidney-failure-range', detail: `An eGFR of ${value} is in the kidney-failure range (KDIGO G5). Discuss with your care team.`, citation: 'KDIGO 2024 — GFR category G5 (<15 mL/min/1.73m²)' }];
  return [];
}
