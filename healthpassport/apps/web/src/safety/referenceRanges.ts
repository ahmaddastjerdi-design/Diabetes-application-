import type { ObservationKey } from '../domain/valuesets/observations';

/**
 * Population reference ranges shown for CONTEXT ONLY (never a diagnosis). Values
 * are in each observation's canonical unit. Sources are guideline bodies; the
 * final numbers are owned by the Clinical Safety Officer (see
 * docs/CLINICAL_SAFETY.md §3). A patient's clinician-set target, when present,
 * takes precedence in the UI over these ranges.
 */
export interface ReferenceRange {
  low?: number;
  high?: number;
  unit: string;
  source: string;
  /** Short label describing what the range represents. */
  label: string;
}

export const REFERENCE_RANGES: Partial<Record<ObservationKey, ReferenceRange>> = {
  glucose: {
    low: 80,
    high: 130,
    unit: 'mg/dL',
    source: 'ADA Standards of Care (pre-prandial target range)',
    label: 'General pre-meal range',
  },
  hba1c: {
    high: 7.0,
    unit: '%',
    source: 'ADA Standards of Care (common adult target)',
    label: 'Common adult target',
  },
  bloodPressure: {
    // Represented via systolic; diastolic handled in rules.
    high: 120,
    unit: 'mmHg',
    source: 'ACC/AHA 2017 (normal systolic)',
    label: 'Normal systolic',
  },
  ldl: {
    high: 100,
    unit: 'mg/dL',
    source: 'ACC/AHA (optimal LDL)',
    label: 'Optimal',
  },
  heartRate: {
    low: 60,
    high: 100,
    unit: 'beats/min',
    source: 'General adult resting range',
    label: 'Resting range',
  },
  bodyTemperature: {
    low: 36.1,
    high: 37.8,
    unit: '°C',
    source: 'General adult range',
    label: 'Typical range',
  },
};
