import { evaluationOf, type Evaluation, type Finding } from './rules';

/**
 * Red-flag symptom catalog. Emergency-pattern symptoms escalate regardless of any
 * numeric reading (docs/MEDICAL_SAFETY_RULES.md §1/§3.1; CLINICAL_REFERENCE §6.2).
 * Reviewed content; final set owned by the Clinical Safety Officer.
 */
export interface RedFlagSymptom {
  code: string;
  label: string;
  disposition: 'EMERGENCY' | 'URGENT';
  citation: string;
}

export const RED_FLAG_SYMPTOMS: RedFlagSymptom[] = [
  { code: 'chest-pain', label: 'Chest pain or pressure', disposition: 'EMERGENCY', citation: 'AHA — acute coronary syndrome warning signs' },
  { code: 'stroke-fast', label: 'Face drooping, arm weakness, or slurred speech', disposition: 'EMERGENCY', citation: 'AHA/ASA — stroke FAST warning signs' },
  { code: 'severe-dyspnea', label: 'Severe difficulty breathing', disposition: 'EMERGENCY', citation: 'Emergency dyspnea red flag' },
  { code: 'syncope', label: 'Fainting or loss of consciousness', disposition: 'EMERGENCY', citation: 'Syncope / loss of consciousness red flag' },
  { code: 'severe-weakness', label: 'Sudden severe weakness', disposition: 'EMERGENCY', citation: 'AHA/ASA — sudden weakness (possible stroke)' },
  { code: 'thunderclap-headache', label: 'Sudden, severe headache', disposition: 'EMERGENCY', citation: 'Thunderclap headache red flag' },
  { code: 'confusion', label: 'Sudden confusion', disposition: 'EMERGENCY', citation: 'AHA/ASA — sudden confusion (possible stroke)' },
  { code: 'dka-pattern', label: 'Nausea, vomiting, and deep rapid breathing with high glucose', disposition: 'EMERGENCY', citation: 'ADA — diabetic ketoacidosis pattern' },
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
        citation: s.citation,
      });
  }
  return evaluationOf(findings);
}
