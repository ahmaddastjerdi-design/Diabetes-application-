import type { SafetyFinding } from './types';

/**
 * Reviewed acute red-flag thresholds. Each rule is data with a citation so it
 * can be audited and versioned. Values are in canonical units. These are
 * illustrative and MUST carry Clinical Safety Officer sign-off before release
 * (docs/CLINICAL_SAFETY.md §2). They detect acute danger patterns only — they
 * are not a diagnosis.
 */

export function glucoseFindings(mgdl: number): SafetyFinding[] {
  if (mgdl < 54) {
    return [
      {
        disposition: 'EMERGENCY',
        code: 'severe-hypoglycemia',
        detail: `A blood glucose of ${mgdl} mg/dL is very low and can be dangerous.`,
        citation: 'ADA — Level 2 hypoglycemia (<54 mg/dL / <3.0 mmol/L)',
      },
    ];
  }
  if (mgdl < 70) {
    return [
      {
        disposition: 'URGENT',
        code: 'hypoglycemia',
        detail: `A blood glucose of ${mgdl} mg/dL is low. Treat it and recheck.`,
        citation: 'ADA — Level 1 hypoglycemia (<70 mg/dL / <3.9 mmol/L)',
      },
    ];
  }
  if (mgdl >= 400) {
    return [
      {
        disposition: 'EMERGENCY',
        code: 'severe-hyperglycemia',
        detail: `A blood glucose of ${mgdl} mg/dL is very high; this can signal a medical emergency.`,
        citation: 'Severe hyperglycemia / DKA-HHS risk threshold',
      },
    ];
  }
  if (mgdl > 250) {
    return [
      {
        disposition: 'URGENT',
        code: 'marked-hyperglycemia',
        detail: `A blood glucose of ${mgdl} mg/dL is high. If this persists, contact your care team.`,
        citation: 'Marked hyperglycemia threshold',
      },
    ];
  }
  return [];
}

export function bloodPressureFindings(
  systolic: number,
  diastolic: number,
): SafetyFinding[] {
  if (systolic >= 180 || diastolic >= 120) {
    return [
      {
        disposition: 'URGENT',
        code: 'hypertensive-crisis-range',
        detail: `A blood pressure of ${systolic}/${diastolic} mmHg is very high. Rest and recheck; if it stays this high or you feel unwell, seek care now.`,
        citation: 'ACC/AHA — hypertensive crisis (≥180 and/or ≥120 mmHg)',
      },
    ];
  }
  if (systolic < 80) {
    return [
      {
        disposition: 'URGENT',
        code: 'hypotension',
        detail: `A systolic pressure of ${systolic} mmHg is low. If you feel dizzy or unwell, contact your care team.`,
        citation: 'Low systolic blood pressure threshold',
      },
    ];
  }
  return [];
}

export function heartRateFindings(bpm: number): SafetyFinding[] {
  if (bpm >= 150) {
    return [
      {
        disposition: 'URGENT',
        code: 'tachycardia',
        detail: `A resting heart rate of ${bpm} bpm is very high. If it persists or you feel unwell, seek care.`,
        citation: 'Marked tachycardia threshold',
      },
    ];
  }
  if (bpm < 40) {
    return [
      {
        disposition: 'URGENT',
        code: 'bradycardia',
        detail: `A resting heart rate of ${bpm} bpm is very low. If you feel faint or unwell, seek care.`,
        citation: 'Marked bradycardia threshold',
      },
    ];
  }
  return [];
}

export function temperatureFindings(celsius: number): SafetyFinding[] {
  if (celsius >= 41) {
    return [
      {
        disposition: 'EMERGENCY',
        code: 'hyperpyrexia',
        detail: `A temperature of ${celsius}°C is dangerously high.`,
        citation: 'Hyperpyrexia (≥41 °C)',
      },
    ];
  }
  if (celsius < 35) {
    return [
      {
        disposition: 'URGENT',
        code: 'hypothermia',
        detail: `A temperature of ${celsius}°C is low (hypothermia range).`,
        citation: 'Hypothermia (<35 °C)',
      },
    ];
  }
  return [];
}
