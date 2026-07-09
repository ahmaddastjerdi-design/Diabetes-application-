import type { Observation } from '../domain/resources';
import {
  OBSERVATIONS,
  type ObservationKey,
} from '../domain/valuesets/observations';
import {
  fahrenheitToCelsius,
  glucoseMmolToMgdl,
  cholMmolToMgdl,
  lbToKg,
} from '../domain/units';
import { REFERENCE_RANGES, type ReferenceRange } from './referenceRanges';
import {
  bloodPressureFindings,
  glucoseFindings,
  heartRateFindings,
  temperatureFindings,
} from './rules';
import { evaluationOf, type SafetyEvaluation, type SafetyFinding } from './types';

// Reverse map: single-value LOINC code -> observation key.
const LOINC_TO_KEY = new Map<string, ObservationKey>(
  Object.values(OBSERVATIONS).map((d) => [d.loinc.code, d.key]),
);

/** Convert a stored value to the observation's canonical unit for rule checks. */
export function toCanonical(
  key: ObservationKey,
  value: number,
  unitCode: string,
): number {
  switch (key) {
    case 'glucose':
      return unitCode === 'mmol/L' ? glucoseMmolToMgdl(value) : value;
    case 'ldl':
      return unitCode === 'mmol/L' ? cholMmolToMgdl(value) : value;
    case 'bodyTemperature':
      return unitCode === '[degF]' ? fahrenheitToCelsius(value) : value;
    case 'weight':
      return unitCode === '[lb_av]' ? lbToKg(value) : value;
    default:
      return value;
  }
}

/** Classify a single observation for acute red flags. Never a diagnosis. */
export function evaluateObservation(obs: Observation): SafetyEvaluation {
  const findings: SafetyFinding[] = [];

  // Blood pressure panel (components present).
  if (
    obs.code.coding[0]?.code === OBSERVATIONS.bloodPressure.loinc.code &&
    obs.components?.length
  ) {
    const systolic = obs.components.find((c) =>
      c.code.coding[0]?.code === '8480-6',
    )?.valueQuantity.value;
    const diastolic = obs.components.find((c) =>
      c.code.coding[0]?.code === '8462-4',
    )?.valueQuantity.value;
    if (systolic !== undefined && diastolic !== undefined) {
      findings.push(...bloodPressureFindings(systolic, diastolic));
    }
    return evaluationOf(findings);
  }

  if (!obs.valueQuantity) return evaluationOf(findings);

  const loinc = obs.code.coding[0]?.code;
  const key = loinc ? LOINC_TO_KEY.get(loinc) : undefined;
  if (!key) return evaluationOf(findings);

  const value = toCanonical(key, obs.valueQuantity.value, obs.valueQuantity.code);

  switch (key) {
    case 'glucose':
      findings.push(...glucoseFindings(value));
      break;
    case 'heartRate':
      findings.push(...heartRateFindings(value));
      break;
    case 'bodyTemperature':
      findings.push(...temperatureFindings(value));
      break;
    // hba1c, ldl, weight have no acute red-flag rules (chronic indicators).
    default:
      break;
  }

  return evaluationOf(findings);
}

export type ReferenceComparison = 'below' | 'in-range' | 'above' | 'unknown';

export interface ReferenceContext {
  range: ReferenceRange;
  comparison: ReferenceComparison;
}

/**
 * Compare a canonical value to the population reference range for display.
 * Returns undefined when no reference exists for the measurement.
 */
export function compareToReference(
  key: ObservationKey,
  canonicalValue: number,
): ReferenceContext | undefined {
  const range = REFERENCE_RANGES[key];
  if (!range) return undefined;
  let comparison: ReferenceComparison = 'in-range';
  if (range.low !== undefined && canonicalValue < range.low) comparison = 'below';
  else if (range.high !== undefined && canonicalValue > range.high)
    comparison = 'above';
  return { range, comparison };
}

export function keyForLoinc(code: string | undefined): ObservationKey | undefined {
  if (!code) return undefined;
  if (code === OBSERVATIONS.bloodPressure.loinc.code) return 'bloodPressure';
  return LOINC_TO_KEY.get(code);
}
