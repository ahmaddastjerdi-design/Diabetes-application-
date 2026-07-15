import { describe, expect, it } from 'vitest';
import {
  formatVitalValue,
  latestVitalViews,
  vitalView,
  type VitalLike,
} from '@/lib/dashboard/metrics';

const at = (iso: string) => new Date(iso);

describe('formatVitalValue', () => {
  it('combines systolic/diastolic for blood pressure', () => {
    const v: VitalLike = {
      type: 'BLOOD_PRESSURE',
      valueNumeric: 185,
      valueSecondary: 125,
      unit: 'mmHg',
      recordedAt: at('2026-07-09'),
    };
    expect(formatVitalValue(v)).toBe('185/125');
  });

  it('shows a single value for other vitals', () => {
    const v: VitalLike = {
      type: 'GLUCOSE',
      valueNumeric: 132,
      valueSecondary: null,
      unit: 'mg/dL',
      recordedAt: at('2026-07-09'),
    };
    expect(formatVitalValue(v)).toBe('132');
  });
});

describe('vitalView status derivation', () => {
  it('marks a hypertensive-crisis reading as needs-attention (caution)', () => {
    const view = vitalView({
      type: 'BLOOD_PRESSURE',
      valueNumeric: 185,
      valueSecondary: 125,
      unit: 'mmHg',
      recordedAt: at('2026-07-09'),
    });
    expect(view.status).toBe('caution');
  });

  it('marks an in-range glucose as ok', () => {
    const view = vitalView({
      type: 'GLUCOSE',
      valueNumeric: 110,
      valueSecondary: null,
      unit: 'mg/dL',
      recordedAt: at('2026-07-09'),
    });
    expect(view.status).toBe('ok');
    expect(view.text).toBe('Within range');
  });

  it('flags a severely low glucose as alert', () => {
    const view = vitalView({
      type: 'GLUCOSE',
      valueNumeric: 45,
      valueSecondary: null,
      unit: 'mg/dL',
      recordedAt: at('2026-07-09'),
    });
    expect(view.status).toBe('alert');
  });
});

describe('latestVitalViews', () => {
  it('keeps only the newest reading per type, in card order', () => {
    const vitals: VitalLike[] = [
      { type: 'GLUCOSE', valueNumeric: 132, valueSecondary: null, unit: 'mg/dL', recordedAt: at('2026-07-09') },
      { type: 'BLOOD_PRESSURE', valueNumeric: 185, valueSecondary: 125, unit: 'mmHg', recordedAt: at('2026-07-09') },
      { type: 'GLUCOSE', valueNumeric: 99, valueSecondary: null, unit: 'mg/dL', recordedAt: at('2026-07-01') },
    ];
    const views = latestVitalViews(vitals);
    expect(views.map((v) => v.type)).toEqual(['BLOOD_PRESSURE', 'GLUCOSE']);
    // Newest glucose (132) wins over the older 99.
    expect(views.find((v) => v.type === 'GLUCOSE')?.value).toBe('132');
  });
});
