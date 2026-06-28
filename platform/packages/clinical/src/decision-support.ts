/**
 * decision-support.ts — clinician decision-SUPPORT rules (Vol 3 §decision support).
 *
 * Each rule turns CGM metrics into a labelled flag for the clinician to review. These
 * are AIDS, never autonomous diagnosis or therapy changes (Vol 3/6 safety framing).
 * Thresholds follow the ADA/ATTD consensus targets.
 */
import { timeInRanges, coefficientOfVariation, type GlucoseReading } from "./agp.js";

export type Severity = "info" | "warning" | "urgent";

export interface Flag {
  code: string;
  severity: Severity;
  message: string;
  /** Always advisory — surfaced to a clinician, never acted on automatically. */
  advisory: true;
}

/** Consensus targets: TIR ≥ 70%, time-below-70 < 4%, time-below-54 < 1%, CV < 36%. */
export const TARGETS = {
  tirAtLeast: 70,
  timeBelow70Under: 4,
  timeBelow54Under: 1,
  cvUnder: 36,
  staleDataHours: 24,
} as const;

export interface EvalInput {
  readings: readonly GlucoseReading[];
  lastReadingMs: number;
}

function flag(code: string, severity: Severity, message: string): Flag {
  return { code, severity, message, advisory: true };
}

/** Evaluate all rules for a patient window at time `now` (epoch ms). */
export function evaluate(input: EvalInput, now: number): Flag[] {
  const flags: Flag[] = [];
  const tir = timeInRanges(input.readings);
  const cv = coefficientOfVariation(input.readings);
  const timeBelow70 = Math.round((tir.veryLow + tir.low) * 10) / 10;

  if (input.readings.length === 0) {
    flags.push(flag("no-data", "info", "No glucose data in the selected window."));
    return flags;
  }

  // Hypoglycaemia exposure — most clinically important, so checked first.
  if (tir.veryLow >= TARGETS.timeBelow54Under)
    flags.push(flag("severe-hypo-exposure", "urgent", `${tir.veryLow}% of time below 54 mg/dL (target < 1%).`));
  if (timeBelow70 > TARGETS.timeBelow70Under)
    flags.push(flag("hypo-exposure", "warning", `${timeBelow70}% of time below 70 mg/dL (target < 4%).`));

  if (tir.target < TARGETS.tirAtLeast)
    flags.push(flag("low-tir", "warning", `Time-in-range ${tir.target}% is below the ${TARGETS.tirAtLeast}% goal.`));

  if (cv > TARGETS.cvUnder)
    flags.push(flag("high-variability", "warning", `Glucose variability (CV ${cv}%) exceeds the ${TARGETS.cvUnder}% stability target.`));

  const hoursSince = (now - input.lastReadingMs) / 3_600_000;
  if (hoursSince > TARGETS.staleDataHours)
    flags.push(flag("stale-data", "info", `No new readings for ${Math.floor(hoursSince)}h.`));

  return flags;
}

/** The single highest severity across flags, for roster badges. */
export function topSeverity(flags: readonly Flag[]): Severity | "none" {
  if (flags.some((f) => f.severity === "urgent")) return "urgent";
  if (flags.some((f) => f.severity === "warning")) return "warning";
  if (flags.some((f) => f.severity === "info")) return "info";
  return "none";
}
