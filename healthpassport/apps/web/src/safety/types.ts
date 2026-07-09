// Clinical-safety types. See docs/CLINICAL_SAFETY.md — this layer classifies,
// escalates, and caveats; it never diagnoses.

/** Ordered from most to least urgent. */
export type Disposition = 'EMERGENCY' | 'URGENT' | 'ROUTINE';

export const DISPOSITION_RANK: Record<Disposition, number> = {
  EMERGENCY: 3,
  URGENT: 2,
  ROUTINE: 1,
};

/** A single reviewed rule outcome. */
export interface SafetyFinding {
  disposition: Disposition;
  /** Stable machine code for the rule, e.g. "severe-hypoglycemia". */
  code: string;
  /** Short, patient-facing explanation of what was detected (not a diagnosis). */
  detail: string;
  /** Guideline citation backing the threshold. */
  citation: string;
}

export interface SafetyEvaluation {
  /** The most urgent disposition across all findings. */
  disposition: Disposition;
  findings: SafetyFinding[];
}

export function mostUrgent(findings: SafetyFinding[]): Disposition {
  return findings.reduce<Disposition>(
    (worst, f) =>
      DISPOSITION_RANK[f.disposition] > DISPOSITION_RANK[worst]
        ? f.disposition
        : worst,
    'ROUTINE',
  );
}

export function evaluationOf(findings: SafetyFinding[]): SafetyEvaluation {
  return { disposition: mostUrgent(findings), findings };
}
