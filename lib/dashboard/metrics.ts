import type { VitalType } from '@prisma/client';
import { VITAL_META } from '@/lib/clinical/measurements';
import {
  compareToRange,
  evaluateVital,
  VITAL_REFERENCE,
} from '@/lib/medical-rules';
import type { HealthStatus } from '@/components/health/status-badge';

export interface VitalLike {
  type: VitalType;
  valueNumeric: number | null;
  valueSecondary: number | null;
  unit: string;
  recordedAt: Date;
}

export interface VitalView {
  type: VitalType;
  label: string;
  value: string;
  unit: string;
  status: HealthStatus;
  text: string;
}

/** The order metric cards are shown on the dashboard. */
const CARD_ORDER: VitalType[] = [
  'BLOOD_PRESSURE',
  'GLUCOSE',
  'HEART_RATE',
  'SPO2',
  'WEIGHT',
  'TEMPERATURE',
];

/** Format a reading's value; blood pressure combines systolic/diastolic. */
export function formatVitalValue(v: VitalLike): string {
  const primary = v.valueNumeric ?? 0;
  if (v.type === 'BLOOD_PRESSURE' && v.valueSecondary != null) {
    return `${primary}/${v.valueSecondary}`;
  }
  return String(primary);
}

/**
 * Derive a colour-plus-text status for a reading. Acute red flags win; then
 * fall back to comparison with the context reference range. Never a diagnosis
 * (docs/MEDICAL_SAFETY_RULES.md).
 */
export function vitalView(v: VitalLike): VitalView {
  const value = v.valueNumeric ?? 0;
  const ev = evaluateVital(
    v.type,
    value,
    v.unit,
    v.valueSecondary ?? undefined,
  );

  let status: HealthStatus;
  let text: string;
  if (ev.disposition === 'EMERGENCY') {
    status = 'alert';
    text = 'Outside safe range';
  } else if (ev.disposition === 'URGENT') {
    status = 'caution';
    text = 'Needs attention';
  } else {
    const cmp = compareToRange(VITAL_REFERENCE[v.type], value);
    if (cmp === 'in-range') {
      status = 'ok';
      text = 'Within range';
    } else if (cmp === 'above') {
      status = 'caution';
      text = 'Above target';
    } else if (cmp === 'below') {
      status = 'caution';
      text = 'Below target';
    } else {
      status = 'neutral';
      text = 'Recorded';
    }
  }

  return {
    type: v.type,
    label: VITAL_META[v.type].label,
    value: formatVitalValue(v),
    unit: v.unit,
    status,
    text,
  };
}

/**
 * Reduce a recorded-desc list of vitals to the latest reading per type, ordered
 * for display. Assumes `vitals` is already sorted newest-first.
 */
export function latestVitalViews(vitals: VitalLike[]): VitalView[] {
  const seen = new Map<VitalType, VitalLike>();
  for (const v of vitals) if (!seen.has(v.type)) seen.set(v.type, v);
  return CARD_ORDER.filter((t) => seen.has(t)).map((t) =>
    vitalView(seen.get(t)!),
  );
}
