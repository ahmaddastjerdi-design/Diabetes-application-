import { describe, expect, it } from 'vitest';
import { compareToReference, evaluateObservation } from './engine';
import { evaluateSymptoms } from './symptoms';
import { mostUrgent } from './types';
import {
  makeBloodPressure,
  makeObservation,
} from '../domain/factories';

const NOW = '2026-07-09T08:00:00.000Z';

describe('evaluateObservation — glucose', () => {
  it('escalates severe hypoglycemia to EMERGENCY', () => {
    const obs = makeObservation('glucose', 45, { unit: 'mg/dL', code: 'mg/dL' }, NOW);
    const evalResult = evaluateObservation(obs);
    expect(evalResult.disposition).toBe('EMERGENCY');
    expect(evalResult.findings[0]?.code).toBe('severe-hypoglycemia');
  });

  it('flags mild hypoglycemia as URGENT', () => {
    const obs = makeObservation('glucose', 62, { unit: 'mg/dL', code: 'mg/dL' }, NOW);
    expect(evaluateObservation(obs).disposition).toBe('URGENT');
  });

  it('treats an in-range glucose as ROUTINE', () => {
    const obs = makeObservation('glucose', 110, { unit: 'mg/dL', code: 'mg/dL' }, NOW);
    expect(evaluateObservation(obs).disposition).toBe('ROUTINE');
  });

  it('converts mmol/L to mg/dL before applying thresholds', () => {
    // 2.5 mmol/L ≈ 45 mg/dL → severe hypoglycemia.
    const obs = makeObservation('glucose', 2.5, { unit: 'mmol/L', code: 'mmol/L' }, NOW);
    expect(evaluateObservation(obs).disposition).toBe('EMERGENCY');
  });

  it('escalates very high glucose to EMERGENCY', () => {
    const obs = makeObservation('glucose', 420, { unit: 'mg/dL', code: 'mg/dL' }, NOW);
    expect(evaluateObservation(obs).disposition).toBe('EMERGENCY');
  });
});

describe('evaluateObservation — blood pressure', () => {
  it('flags hypertensive-crisis-range readings as URGENT', () => {
    const obs = makeBloodPressure(185, 125, NOW);
    const result = evaluateObservation(obs);
    expect(result.disposition).toBe('URGENT');
    expect(result.findings[0]?.code).toBe('hypertensive-crisis-range');
  });

  it('treats a normal blood pressure as ROUTINE', () => {
    expect(evaluateObservation(makeBloodPressure(118, 76, NOW)).disposition).toBe(
      'ROUTINE',
    );
  });
});

describe('reference comparison', () => {
  it('reports above/in/below relative to the reference range', () => {
    expect(compareToReference('glucose', 200)?.comparison).toBe('above');
    expect(compareToReference('glucose', 100)?.comparison).toBe('in-range');
    expect(compareToReference('glucose', 60)?.comparison).toBe('below');
  });

  it('returns undefined when no reference exists', () => {
    expect(compareToReference('weight', 70)).toBeUndefined();
  });
});

describe('symptom escalation', () => {
  it('escalates chest pain to EMERGENCY', () => {
    expect(evaluateSymptoms(['chest-pain']).disposition).toBe('EMERGENCY');
  });

  it('takes the most urgent across multiple symptoms', () => {
    expect(evaluateSymptoms(['confusion', 'chest-pain']).disposition).toBe(
      'EMERGENCY',
    );
  });

  it('ignores unknown symptom codes', () => {
    expect(evaluateSymptoms(['not-a-symptom']).disposition).toBe('ROUTINE');
  });
});

describe('mostUrgent', () => {
  it('orders EMERGENCY > URGENT > ROUTINE', () => {
    expect(
      mostUrgent([
        { disposition: 'ROUTINE', code: 'a', detail: '', citation: '' },
        { disposition: 'EMERGENCY', code: 'b', detail: '', citation: '' },
        { disposition: 'URGENT', code: 'c', detail: '', citation: '' },
      ]),
    ).toBe('EMERGENCY');
  });
});
