/**
 * agp.ts — ambulatory glucose profile metrics (Vol 3 §AGP/trends).
 *
 * Pure functions over CGM readings, implementing the international consensus CGM
 * metrics (ADA/ATTD "Clinical Targets for CGM Data Interpretation", Battelino et al.,
 * Diabetes Care 2019). All glucose values are mg/dL. These are decision-SUPPORT metrics
 * shown to clinicians — not autonomous diagnosis.
 */

export interface GlucoseReading {
  /** mg/dL */
  value: number;
  /** epoch ms */
  atMs: number;
}

/** Consensus glucose ranges (mg/dL). Target range is 70–180 for most adults. */
export const RANGES = {
  veryLow: { lt: 54 },
  low: { gte: 54, lt: 70 },
  target: { gte: 70, lte: 180 },
  high: { gt: 180, lte: 250 },
  veryHigh: { gt: 250 },
} as const;

export interface TimeInRanges {
  veryLow: number; // % < 54
  low: number; // % 54–69
  target: number; // % 70–180 (TIR)
  high: number; // % 181–250
  veryHigh: number; // % > 250
}

/** Percentage of readings in each consensus band (sums to ~100). */
export function timeInRanges(readings: readonly GlucoseReading[]): TimeInRanges {
  const n = readings.length;
  if (n === 0) return { veryLow: 0, low: 0, target: 0, high: 0, veryHigh: 0 };
  let vl = 0, lo = 0, tgt = 0, hi = 0, vh = 0;
  for (const r of readings) {
    const v = r.value;
    if (v < 54) vl++;
    else if (v < 70) lo++;
    else if (v <= 180) tgt++;
    else if (v <= 250) hi++;
    else vh++;
  }
  const pct = (c: number) => Math.round((c / n) * 1000) / 10;
  return { veryLow: pct(vl), low: pct(lo), target: pct(tgt), high: pct(hi), veryHigh: pct(vh) };
}

export function meanGlucose(readings: readonly GlucoseReading[]): number {
  if (readings.length === 0) return 0;
  return readings.reduce((s, r) => s + r.value, 0) / readings.length;
}

/**
 * Glucose Management Indicator (estimated A1C), Bergenstal et al. 2018:
 * GMI(%) = 3.31 + 0.02392 × mean glucose (mg/dL).
 */
export function gmi(meanMgdl: number): number {
  return Math.round((3.31 + 0.02392 * meanMgdl) * 10) / 10;
}

/** Glucose variability as coefficient of variation (%). Consensus stability is CV < 36%. */
export function coefficientOfVariation(readings: readonly GlucoseReading[]): number {
  const n = readings.length;
  if (n < 2) return 0;
  const mean = meanGlucose(readings);
  if (mean === 0) return 0;
  const variance = readings.reduce((s, r) => s + (r.value - mean) ** 2, 0) / (n - 1);
  return Math.round((Math.sqrt(variance) / mean) * 1000) / 10;
}

/** Percentile (linear interpolation) of a numeric sample; p in [0,100]. */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const frac = idx - lo;
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * frac;
}

export interface HourBand {
  hour: number; // 0–23 (UTC)
  p25: number;
  p50: number;
  p75: number;
}

/** Per-hour-of-day percentile bands — the shape an AGP chart plots (Vol 3). */
export function agpByHour(readings: readonly GlucoseReading[]): HourBand[] {
  const byHour = new Map<number, number[]>();
  for (const r of readings) {
    const hour = new Date(r.atMs).getUTCHours();
    (byHour.get(hour) ?? byHour.set(hour, []).get(hour)!).push(r.value);
  }
  return [...byHour.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hour, vals]) => ({
      hour,
      p25: Math.round(percentile(vals, 25)),
      p50: Math.round(percentile(vals, 50)),
      p75: Math.round(percentile(vals, 75)),
    }));
}
