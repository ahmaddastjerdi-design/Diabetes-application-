import { evaluationOf, type SafetyEvaluation, type SafetyFinding } from './types';

/**
 * Red-flag symptom catalog. Emergency-pattern symptoms escalate regardless of
 * any numeric reading (docs/CLINICAL_SAFETY.md §1). Reviewed content; final set
 * owned by the Clinical Safety Officer. Used by symptom check-ins (later phase);
 * exposed now so the escalation path is testable and stable.
 */
export interface RedFlagSymptom {
  code: string;
  label: string;
  disposition: 'EMERGENCY' | 'URGENT';
}

export const RED_FLAG_SYMPTOMS: RedFlagSymptom[] = [
  { code: 'chest-pain', label: 'Chest pain or pressure', disposition: 'EMERGENCY' },
  {
    code: 'face-arm-speech',
    label: 'Face drooping, arm weakness, or slurred speech',
    disposition: 'EMERGENCY',
  },
  {
    code: 'severe-breathlessness',
    label: 'Severe difficulty breathing',
    disposition: 'EMERGENCY',
  },
  {
    code: 'loss-of-consciousness',
    label: 'Fainting or loss of consciousness',
    disposition: 'EMERGENCY',
  },
  {
    code: 'confusion',
    label: 'Sudden confusion',
    disposition: 'URGENT',
  },
  {
    code: 'dka-symptoms',
    label: 'Nausea, vomiting, and deep rapid breathing with high glucose',
    disposition: 'URGENT',
  },
];

const BY_CODE = new Map(RED_FLAG_SYMPTOMS.map((s) => [s.code, s]));

export function evaluateSymptoms(codes: readonly string[]): SafetyEvaluation {
  const findings: SafetyFinding[] = [];
  for (const code of codes) {
    const symptom = BY_CODE.get(code);
    if (symptom) {
      findings.push({
        disposition: symptom.disposition,
        code: `symptom:${symptom.code}`,
        detail: symptom.label,
        citation: 'Reviewed red-flag symptom catalog',
      });
    }
  }
  return evaluationOf(findings);
}
