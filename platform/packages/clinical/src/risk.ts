/**
 * risk.ts — roster risk stratification (Vol 3 §population management).
 * Ranks patients so the clinician triages the highest-risk first. A weighted, bounded
 * score from consensus-target deviations — a triage aid, not a diagnosis.
 */

export interface PatientMetrics {
  patientId: string;
  tir: number; // % time-in-range 70–180
  timeBelow54: number; // % very low
  cv: number; // variability %
  lastReadingMs: number;
}

export type RiskTier = "high" | "medium" | "low";

export interface RiskResult extends PatientMetrics {
  score: number; // 0..100, higher = more concerning
  tier: RiskTier;
}

/** Bounded 0..100 risk score; hypo exposure dominates, then low TIR, variability, staleness. */
export function riskScore(m: PatientMetrics, now: number): number {
  const hypo = Math.min(m.timeBelow54, 5) * 8; // up to 40
  const tirGap = Math.max(0, 70 - m.tir) * 0.5; // up to 35
  const variability = Math.max(0, m.cv - 36) * 0.8; // ~ up to 15
  const staleH = (now - m.lastReadingMs) / 3_600_000;
  const stale = staleH > 24 ? 10 : 0;
  return Math.min(100, Math.round(hypo + tirGap + variability + stale));
}

/**
 * Tier from score, with a clinical override: any time below 54 mg/dL at or above the
 * consensus 1% threshold is escalated to `high` regardless of the numeric score —
 * severe hypoglycaemia exposure always warrants prompt clinician review.
 */
function tierFor(m: PatientMetrics, score: number): RiskTier {
  if (m.timeBelow54 >= 1 || score >= 50) return "high";
  if (score >= 20) return "medium";
  return "low";
}

/** Score and sort a roster, most-concerning first. */
export function stratify(patients: readonly PatientMetrics[], now: number): RiskResult[] {
  return patients
    .map((m) => {
      const score = riskScore(m, now);
      return { ...m, score, tier: tierFor(m, score) };
    })
    .sort((a, b) => b.score - a.score);
}
