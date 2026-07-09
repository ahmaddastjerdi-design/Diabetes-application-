import type { VitalType, LabType } from '@prisma/client';
import {
  classifyBloodPressure,
  classifyEgfr,
  classifyGlucose,
  classifyHeartRate,
  classifyLdl,
  classifyPotassium,
  classifySpo2,
  classifyTemperature,
  classifyTriglycerides,
  evaluationOf,
  type Evaluation,
} from './rules';

export * from './rules';
export * from './symptoms';

/** Evaluate a vital reading for acute red flags. `value2` is diastolic for BP. */
export function evaluateVital(
  type: VitalType,
  value: number,
  unit: string,
  value2?: number,
): Evaluation {
  switch (type) {
    case 'GLUCOSE':
      return evaluationOf(classifyGlucose(value, unit));
    case 'BLOOD_PRESSURE':
      return evaluationOf(
        value2 !== undefined ? classifyBloodPressure(value, value2) : [],
      );
    case 'SPO2':
      return evaluationOf(classifySpo2(value));
    case 'HEART_RATE':
      return evaluationOf(classifyHeartRate(value));
    case 'TEMPERATURE':
      return evaluationOf(classifyTemperature(value, unit));
    default:
      return evaluationOf([]);
  }
}

/** Evaluate a lab result for acute red flags. */
export function evaluateLab(type: LabType, value: number): Evaluation {
  switch (type) {
    case 'POTASSIUM':
      return evaluationOf(classifyPotassium(value));
    case 'EGFR':
      return evaluationOf(classifyEgfr(value));
    case 'LDL':
      return evaluationOf(classifyLdl(value));
    case 'TRIGLYCERIDES':
      return evaluationOf(classifyTriglycerides(value));
    default:
      return evaluationOf([]);
  }
}

// ── Reference ranges for context-only display (never a diagnosis) ──
export interface ReferenceRange {
  low?: number;
  high?: number;
  unit: string;
  label: string;
  source: string;
}

export const VITAL_REFERENCE: Partial<Record<VitalType, ReferenceRange>> = {
  GLUCOSE: { low: 80, high: 130, unit: 'mg/dL', label: 'Pre-meal target', source: 'ADA' },
  BLOOD_PRESSURE: { high: 120, unit: 'mmHg', label: 'Normal systolic', source: 'ACC/AHA 2017' },
  HEART_RATE: { low: 60, high: 100, unit: 'bpm', label: 'Resting range', source: 'General adult' },
  TEMPERATURE: { low: 36.1, high: 37.8, unit: '°C', label: 'Typical range', source: 'General adult' },
  SPO2: { low: 95, high: 100, unit: '%', label: 'Typical range', source: 'General adult' },
  WEIGHT: { unit: 'kg', label: '', source: '' },
  WAIST: { unit: 'cm', label: '', source: '' },
};

export const LAB_REFERENCE: Partial<Record<LabType, ReferenceRange>> = {
  HBA1C: { high: 7.0, unit: '%', label: 'Common adult target', source: 'ADA' },
  LDL: { high: 100, unit: 'mg/dL', label: 'Optimal', source: 'ACC/AHA' },
  HDL: { low: 40, unit: 'mg/dL', label: 'Desirable (≥40)', source: 'NCEP ATP III' },
  TRIGLYCERIDES: { high: 150, unit: 'mg/dL', label: 'Normal', source: 'NCEP ATP III' },
  TOTAL_CHOLESTEROL: { high: 200, unit: 'mg/dL', label: 'Desirable', source: 'NCEP ATP III' },
  CREATININE: { low: 0.6, high: 1.3, unit: 'mg/dL', label: 'Typical range', source: 'General adult' },
  EGFR: { low: 60, unit: 'mL/min/1.73m²', label: 'G1–G2 (≥60)', source: 'KDIGO 2024' },
  UACR: { high: 30, unit: 'mg/g', label: 'A1 normal (<30)', source: 'KDIGO 2024' },
  POTASSIUM: { low: 3.5, high: 5.0, unit: 'mmol/L', label: 'Typical range', source: 'General adult' },
};

export type ReferenceComparison = 'below' | 'in-range' | 'above' | 'unknown';

export function compareToRange(
  range: ReferenceRange | undefined,
  value: number,
): ReferenceComparison {
  if (!range) return 'unknown';
  if (range.low !== undefined && value < range.low) return 'below';
  if (range.high !== undefined && value > range.high) return 'above';
  return 'in-range';
}
