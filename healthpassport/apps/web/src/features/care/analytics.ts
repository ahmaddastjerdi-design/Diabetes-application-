import type { Observation } from '../../domain/resources';
import { OBSERVATIONS } from '../../domain/valuesets/observations';
import { toCanonical } from '../../safety/engine';
import { estimatedA1cFromAvgGlucoseMgdl } from '../../domain/units';

export interface DataPoint {
  at: string; // ISO instant
  value: number; // canonical unit
}

function byTimeAsc(a: DataPoint, b: DataPoint): number {
  return a.at.localeCompare(b.at);
}

/** Glucose readings in canonical mg/dL, oldest first. */
export function glucoseSeries(observations: Observation[]): DataPoint[] {
  const code = OBSERVATIONS.glucose.loinc.code;
  return observations
    .filter((o) => o.code.coding[0]?.code === code && o.valueQuantity)
    .map((o) => ({
      at: o.effectiveDateTime,
      value: toCanonical('glucose', o.valueQuantity!.value, o.valueQuantity!.code),
    }))
    .sort(byTimeAsc);
}

/** Systolic/diastolic series in mmHg from blood-pressure panel observations. */
export function bloodPressureSeries(observations: Observation[]): {
  systolic: DataPoint[];
  diastolic: DataPoint[];
} {
  const code = OBSERVATIONS.bloodPressure.loinc.code;
  const systolic: DataPoint[] = [];
  const diastolic: DataPoint[] = [];
  for (const o of observations) {
    if (o.code.coding[0]?.code !== code || !o.components) continue;
    const sys = o.components.find((c) => c.code.coding[0]?.code === '8480-6');
    const dia = o.components.find((c) => c.code.coding[0]?.code === '8462-4');
    if (sys) systolic.push({ at: o.effectiveDateTime, value: sys.valueQuantity.value });
    if (dia) diastolic.push({ at: o.effectiveDateTime, value: dia.valueQuantity.value });
  }
  systolic.sort(byTimeAsc);
  diastolic.sort(byTimeAsc);
  return { systolic, diastolic };
}

export function latest(series: DataPoint[]): DataPoint | undefined {
  return series.length ? series[series.length - 1] : undefined;
}

export function average(series: DataPoint[]): number | undefined {
  if (!series.length) return undefined;
  const sum = series.reduce((acc, p) => acc + p.value, 0);
  return sum / series.length;
}

/**
 * Estimated HbA1c from the trailing glucose average — a SIMPLIFIED derived
 * indicator (docs/CLINICAL_SAFETY.md §7), not a lab result. Requires a minimum
 * number of readings to be meaningful.
 */
export function estimatedA1c(
  glucose: DataPoint[],
  minReadings = 5,
): number | undefined {
  if (glucose.length < minReadings) return undefined;
  const avg = average(glucose);
  return avg === undefined ? undefined : estimatedA1cFromAvgGlucoseMgdl(avg);
}

export type TrendDirection = 'up' | 'down' | 'flat';

/** Compare the mean of the most recent half of the series to the older half. */
export function trend(series: DataPoint[], epsilon = 1): TrendDirection {
  if (series.length < 4) return 'flat';
  const mid = Math.floor(series.length / 2);
  const older = average(series.slice(0, mid)) ?? 0;
  const newer = average(series.slice(mid)) ?? 0;
  if (newer - older > epsilon) return 'up';
  if (older - newer > epsilon) return 'down';
  return 'flat';
}
