// Red-flag rules engine. Thresholds are cited (see docs/CLINICAL_REFERENCE.md and
// docs/MEDICAL_SAFETY_RULES.md) and pending Clinical Safety Officer sign-off.
// This layer CLASSIFIES and ESCALATES — it never diagnoses.
//
// NOTE (personal targets): these are population reference thresholds. Clinician-set
// personal targets, when captured, must take visual precedence (MEDICAL_SAFETY_RULES
// §4). Target override is a later-phase feature and is intentionally not yet wired.

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

/** Merge several evaluations, keeping every finding and the worst disposition. */
export function mergeEvaluations(...evals: Evaluation[]): Evaluation {
  return evaluationOf(evals.flatMap((e) => e.findings));
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
    return [{ disposition: 'EMERGENCY', code: 'severe-hypoglycemia', detail: `Blood glucose ${value} ${unit} is very low and can be dangerous.`, citation: 'ADA Standards of Care — Level 2 hypoglycemia (<54 mg/dL / <3.0 mmol/L)' }];
  if (mgdl < 70)
    return [{ disposition: 'URGENT', code: 'hypoglycemia', detail: `Blood glucose ${value} ${unit} is low. Treat it and recheck.`, citation: 'ADA Standards of Care — Level 1 hypoglycemia (<70 mg/dL / <3.9 mmol/L)' }];
  if (mgdl >= 400)
    return [{ disposition: 'EMERGENCY', code: 'severe-hyperglycemia', detail: `Blood glucose ${value} ${unit} is very high; this can signal an emergency.`, citation: 'ADA / consensus — severe hyperglycemia (DKA/HHS risk), app safety anchor ≥400 mg/dL' }];
  if (mgdl > 250)
    return [{ disposition: 'URGENT', code: 'marked-hyperglycemia', detail: `Blood glucose ${value} ${unit} is high. If this persists, contact your care team.`, citation: 'ADA / consensus — marked hyperglycemia (>250 mg/dL)' }];
  return [];
}

export function classifyBloodPressure(systolic: number, diastolic: number): Finding[] {
  if (systolic >= 180 || diastolic >= 120)
    return [{ disposition: 'URGENT', code: 'hypertensive-crisis-range', detail: `Blood pressure ${systolic}/${diastolic} mmHg is very high. Rest and recheck; if it stays this high or you feel unwell, seek care now.`, citation: 'ACC/AHA 2017 — hypertensive crisis (≥180 and/or ≥120 mmHg)' }];
  if (systolic < 90)
    return [{ disposition: 'URGENT', code: 'hypotension', detail: `Systolic pressure ${systolic} mmHg is low. If you feel dizzy or unwell, contact your care team.`, citation: 'App safety anchor (possible symptomatic hypotension), pending CSO citation' }];
  return [];
}

export function classifySpo2(value: number): Finding[] {
  if (value < 90)
    return [{ disposition: 'EMERGENCY', code: 'severe-hypoxemia', detail: `Oxygen saturation ${value}% is very low.`, citation: 'WHO — hypoxemia (<90%)' }];
  if (value < 92)
    return [{ disposition: 'URGENT', code: 'hypoxemia', detail: `Oxygen saturation ${value}% is low. If you are breathless, seek care.`, citation: 'RCP NEWS2 — low SpO₂ (scale 1 ≤93%); WHO hypoxemia <90%' }];
  return [];
}

export function classifyHeartRate(value: number): Finding[] {
  if (value >= 131)
    return [{ disposition: 'URGENT', code: 'tachycardia', detail: `Resting heart rate ${value} bpm is high. If it persists or you feel unwell, seek care.`, citation: 'RCP NEWS2 — heart rate ≥131/min (score 3)' }];
  if (value <= 40)
    return [{ disposition: 'URGENT', code: 'bradycardia', detail: `Resting heart rate ${value} bpm is low. If you feel faint, seek care.`, citation: 'RCP NEWS2 — heart rate ≤40/min (score 3)' }];
  return [];
}

export function classifyTemperature(value: number, unit: string): Finding[] {
  const c = tempToCelsius(value, unit);
  if (c >= 41)
    return [{ disposition: 'EMERGENCY', code: 'hyperpyrexia', detail: `Temperature ${value} ${unit} is dangerously high.`, citation: 'App safety anchor (hyperpyrexia ≥41 °C), pending CSO citation' }];
  if (c < 32)
    return [{ disposition: 'EMERGENCY', code: 'severe-hypothermia', detail: `Temperature ${value} ${unit} is dangerously low (severe hypothermia).`, citation: 'App safety anchor (severe hypothermia <32 °C), pending CSO citation' }];
  if (c >= 39.1)
    return [{ disposition: 'URGENT', code: 'high-fever', detail: `Temperature ${value} ${unit} is a high fever. If you feel very unwell, contact your care team.`, citation: 'RCP NEWS2 — temperature ≥39.1 °C (score 2)' }];
  if (c <= 35)
    return [{ disposition: 'URGENT', code: 'hypothermia', detail: `Temperature ${value} ${unit} is low (hypothermia range).`, citation: 'RCP NEWS2 — temperature ≤35.0 °C (score 3)' }];
  return [];
}

// ── Lab classification ──
export function classifyPotassium(value: number): Finding[] {
  if (value >= 6.5)
    return [{ disposition: 'EMERGENCY', code: 'severe-hyperkalemia', detail: `Potassium ${value} mmol/L is severely high (arrhythmia risk).`, citation: 'Severe hyperkalemia (≥6.5 mmol/L, conservative ERC band)' }];
  if (value >= 5.5)
    return [{ disposition: 'URGENT', code: 'hyperkalemia', detail: `Potassium ${value} mmol/L is high. Contact your care team.`, citation: 'ERC / standard clinical refs — hyperkalemia (5.5–6.4 mmol/L)' }];
  if (value < 2.5)
    return [{ disposition: 'EMERGENCY', code: 'severe-hypokalemia', detail: `Potassium ${value} mmol/L is severely low (arrhythmia risk).`, citation: 'Standard clinical refs — severe hypokalemia (<2.5 mmol/L), pending CSO citation' }];
  if (value < 3.5)
    return [{ disposition: 'URGENT', code: 'hypokalemia', detail: `Potassium ${value} mmol/L is low. Contact your care team.`, citation: 'Standard clinical refs — hypokalemia (<3.5 mmol/L)' }];
  return [];
}

export function classifyEgfr(value: number): Finding[] {
  if (value < 15)
    return [{ disposition: 'URGENT', code: 'egfr-g5', detail: `An eGFR of ${value} falls in the range KDIGO labels "kidney failure" (G5). This is a reference category, not a diagnosis — contact your care team promptly.`, citation: 'KDIGO 2024 — GFR category G5 (<15 mL/min/1.73m²)' }];
  if (value < 30)
    return [{ disposition: 'URGENT', code: 'egfr-g4', detail: `An eGFR of ${value} is in KDIGO category G4 (severely reduced). This is a reference category, not a diagnosis — discuss it with your care team.`, citation: 'KDIGO 2024 — GFR category G4 (15–29 mL/min/1.73m²)' }];
  return [];
}

export function classifyLdl(value: number): Finding[] {
  // Assumes mg/dL (the app default for LDL).
  if (value >= 190)
    return [{ disposition: 'URGENT', code: 'severe-hypercholesterolemia', detail: `An LDL of ${value} mg/dL is very high. Discuss it with your care team.`, citation: 'ACC/AHA — severe hypercholesterolemia (LDL ≥190 mg/dL)' }];
  return [];
}

export function classifyTriglycerides(value: number): Finding[] {
  if (value >= 500)
    return [{ disposition: 'URGENT', code: 'severe-hypertriglyceridemia', detail: `Triglycerides of ${value} mg/dL are very high (pancreatitis risk). Discuss with your care team.`, citation: 'ACC/AHA / Endocrine Society — severe hypertriglyceridemia (≥500 mg/dL)' }];
  return [];
}
