import { evaluationOf, type Evaluation, type Finding } from './rules';

/**
 * Red-flag symptom catalog. Emergency-pattern symptoms escalate regardless of any
 * numeric reading (docs/MEDICAL_SAFETY_RULES.md §1/§3.1). Reviewed content;
 * final set owned by the Clinical Safety Officer.
 */
export interface RedFlagSymptom {
  code: string;
  label: string;
  disposition: 'EMERGENCY' | 'URGENT';
}

export const RED_FLAG_SYMPTOMS: RedFlagSymptom[] = [
  { code: 'chest-pain', label: 'Chest pain or pressure', disposition: 'EMERGENCY' },
  { code: 'stroke-fast', label: 'Face drooping, arm weakness, or slurred speech', disposition: 'EMERGENCY' },
  { code: 'severe-dyspnea', label: 'Severe difficulty breathing', disposition: 'EMERGENCY' },
  { code: 'syncope', label: 'Fainting or loss of consciousness', disposition: 'EMERGENCY' },
  { code: 'severe-weakness', label: 'Sudden severe weakness', disposition: 'EMERGENCY' },
  { code: 'thunderclap-headache', label: 'Sudden, severe headache', disposition: 'EMERGENCY' },
  { code: 'confusion', label: 'Sudden confusion', disposition: 'URGENT' },
  { code: 'dka-pattern', label: 'Nausea, vomiting, and deep rapid breathing with high glucose', disposition: 'URGENT' },
];

const BY_CODE = new Map(RED_FLAG_SYMPTOMS.map((s) => [s.code, s]));

export function evaluateSymptoms(codes: readonly string[]): Evaluation {
  const findings: Finding[] = [];
  for (const code of codes) {
    const s = BY_CODE.get(code);
    if (s)
      findings.push({
        disposition: s.disposition,
        code: `symptom:${s.code}`,
        detail: s.label,
        citation: 'Reviewed red-flag symptom catalog',
      });
  }
  return evaluationOf(findings);
}
