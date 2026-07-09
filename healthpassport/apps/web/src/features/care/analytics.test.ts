import { describe, expect, it } from 'vitest';
import {
  bloodPressureSeries,
  estimatedA1c,
  glucoseSeries,
  latest,
  trend,
} from './analytics';
import { makeBloodPressure, makeObservation } from '../../domain/factories';
import { activeCareModules } from '../../domain/valuesets/conditions';
import { makeCondition } from '../../domain/factories';
import { CONDITION_CATALOG } from '../../domain/valuesets/conditions';

function glucoseAt(value: number, iso: string, unit = { unit: 'mg/dL', code: 'mg/dL' }) {
  return makeObservation('glucose', value, unit, iso);
}

describe('glucoseSeries', () => {
  it('filters, converts to mg/dL, and sorts oldest-first', () => {
    const obs = [
      glucoseAt(120, '2026-07-03T08:00:00.000Z'),
      glucoseAt(5, '2026-07-01T08:00:00.000Z', { unit: 'mmol/L', code: 'mmol/L' }), // ~90 mg/dL
      makeBloodPressure(120, 80, '2026-07-02T08:00:00.000Z'), // ignored
    ];
    const series = glucoseSeries(obs);
    expect(series).toHaveLength(2);
    expect(series[0]?.at).toBe('2026-07-01T08:00:00.000Z');
    expect(series[0]?.value).toBeCloseTo(90, 0);
    expect(series[1]?.value).toBe(120);
  });
});

describe('estimatedA1c', () => {
  it('is undefined below the minimum readings threshold', () => {
    const obs = [glucoseAt(120, '2026-07-01T08:00:00.000Z')];
    expect(estimatedA1c(glucoseSeries(obs))).toBeUndefined();
  });

  it('computes from the average once enough readings exist', () => {
    const obs = Array.from({ length: 6 }, (_, i) =>
      glucoseAt(154, `2026-07-0${i + 1}T08:00:00.000Z`),
    );
    // avg 154 mg/dL -> ~7.0%
    expect(estimatedA1c(glucoseSeries(obs))).toBeCloseTo(7.0, 1);
  });
});

describe('bloodPressureSeries', () => {
  it('extracts systolic and diastolic components', () => {
    const obs = [makeBloodPressure(140, 90, '2026-07-01T08:00:00.000Z')];
    const { systolic, diastolic } = bloodPressureSeries(obs);
    expect(systolic[0]?.value).toBe(140);
    expect(diastolic[0]?.value).toBe(90);
  });
});

describe('trend and latest', () => {
  it('detects an upward trend', () => {
    const series = [
      { at: 'a', value: 100 },
      { at: 'b', value: 105 },
      { at: 'c', value: 150 },
      { at: 'd', value: 160 },
    ];
    expect(trend(series)).toBe('up');
    expect(latest(series)?.value).toBe(160);
  });
});

describe('activeCareModules', () => {
  it('maps stored diabetes/hypertension conditions to modules', () => {
    const dm = CONDITION_CATALOG.find((c) => c.key === 'type2-diabetes')!;
    const htn = CONDITION_CATALOG.find((c) => c.key === 'hypertension')!;
    const lipids = CONDITION_CATALOG.find((c) => c.key === 'hyperlipidemia')!;
    const conditions = [
      makeCondition(dm.concept),
      makeCondition(htn.concept),
      makeCondition(lipids.concept),
    ];
    const modules = activeCareModules(conditions);
    expect(modules).toContain('diabetes');
    expect(modules).toContain('hypertension');
    expect(modules).toHaveLength(2);
  });
});
