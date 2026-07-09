import type { HealthResource } from './resources';

export interface ValidationIssue {
  field: string;
  message: string;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; issues: ValidationIssue[] };

function ok(): ValidationResult {
  return { ok: true };
}
function fail(issues: ValidationIssue[]): ValidationResult {
  return { ok: false, issues };
}

/**
 * Plausibility bounds for readings. These are NOT clinical thresholds — they
 * only reject impossible/typo values (negative, absurd). Clinical
 * interpretation and red-flag detection live in src/safety.
 */
const PLAUSIBLE_RANGES: Record<string, { min: number; max: number }> = {
  '2339-0': { min: 10, max: 1500 }, // glucose mg/dL
  '4548-4': { min: 2, max: 20 }, // HbA1c %
  '8480-6': { min: 40, max: 300 }, // systolic mmHg
  '8462-4': { min: 20, max: 200 }, // diastolic mmHg
  '29463-7': { min: 1, max: 500 }, // weight kg
  '8867-4': { min: 20, max: 300 }, // heart rate
  '8310-5': { min: 25, max: 45 }, // temperature °C
  '13457-7': { min: 5, max: 600 }, // LDL mg/dL
};

function checkQuantity(
  loincCode: string | undefined,
  value: number,
  field: string,
  issues: ValidationIssue[],
): void {
  if (!Number.isFinite(value)) {
    issues.push({ field, message: 'Enter a number.' });
    return;
  }
  const range = loincCode ? PLAUSIBLE_RANGES[loincCode] : undefined;
  if (range && (value < range.min || value > range.max)) {
    issues.push({
      field,
      message: `Value looks out of range (expected ${range.min}–${range.max}). Please check.`,
    });
  }
}

export function validateResource(resource: HealthResource): ValidationResult {
  const issues: ValidationIssue[] = [];

  switch (resource.resourceType) {
    case 'Observation': {
      if (!resource.code.coding.length && !resource.code.text) {
        issues.push({ field: 'code', message: 'Choose what was measured.' });
      }
      const loinc = resource.code.coding[0]?.code;
      if (resource.valueQuantity) {
        checkQuantity(loinc, resource.valueQuantity.value, 'value', issues);
      } else if (resource.components && resource.components.length) {
        for (const c of resource.components) {
          checkQuantity(
            c.code.coding[0]?.code,
            c.valueQuantity.value,
            c.code.text,
            issues,
          );
        }
      } else {
        issues.push({ field: 'value', message: 'Enter a value.' });
      }
      if (!resource.effectiveDateTime) {
        issues.push({ field: 'effectiveDateTime', message: 'Enter a date/time.' });
      }
      break;
    }
    case 'Condition': {
      if (!resource.code.text) {
        issues.push({ field: 'code', message: 'Choose a condition.' });
      }
      break;
    }
    case 'MedicationStatement': {
      if (!resource.medication.text) {
        issues.push({ field: 'medication', message: 'Enter a medication.' });
      }
      break;
    }
    case 'AllergyIntolerance': {
      if (!resource.code.text) {
        issues.push({ field: 'code', message: 'Enter an allergy.' });
      }
      break;
    }
    case 'Patient':
      // All Patient fields are optional in Phase 1.
      break;
  }

  return issues.length ? fail(issues) : ok();
}
