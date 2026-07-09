import { describe, expect, it } from 'vitest';
import {
  compareToRange,
  evaluateLab,
  evaluateVital,
  evaluateSymptoms,
  mergeEvaluations,
  VITAL_REFERENCE,
} from '@/lib/medical-rules';

describe('vital red-flag escalation', () => {
  it('escalates severe hypoglycemia to EMERGENCY (mg/dL)', () => {
    expect(evaluateVital('GLUCOSE', 45, 'mg/dL').disposition).toBe('EMERGENCY');
  });

  it('converts mmol/L before applying glucose thresholds', () => {
    // 2.5 mmol/L ≈ 45 mg/dL → EMERGENCY.
    expect(evaluateVital('GLUCOSE', 2.5, 'mmol/L').disposition).toBe('EMERGENCY');
    // 6 mmol/L ≈ 108 mg/dL → ROUTINE.
    expect(evaluateVital('GLUCOSE', 6, 'mmol/L').disposition).toBe('ROUTINE');
  });

  it('flags hypertensive-crisis-range blood pressure as URGENT', () => {
    const e = evaluateVital('BLOOD_PRESSURE', 185, 'mmHg', 125);
    expect(e.disposition).toBe('URGENT');
    expect(e.findings[0]?.code).toBe('hypertensive-crisis-range');
  });

  it('treats a normal blood pressure as ROUTINE', () => {
    expect(evaluateVital('BLOOD_PRESSURE', 118, 'mmHg', 76).disposition).toBe('ROUTINE');
  });

  it('escalates hypoxemia: <90 EMERGENCY, <92 URGENT (WHO)', () => {
    expect(evaluateVital('SPO2', 86, '%').disposition).toBe('EMERGENCY');
    expect(evaluateVital('SPO2', 89, '%').disposition).toBe('EMERGENCY');
    expect(evaluateVital('SPO2', 91, '%').disposition).toBe('URGENT');
    expect(evaluateVital('SPO2', 98, '%').disposition).toBe('ROUTINE');
  });

  it('converts Fahrenheit and covers fever/hypothermia bands', () => {
    // 106°F ≈ 41.1°C → EMERGENCY; severe hypothermia <32°C → EMERGENCY.
    expect(evaluateVital('TEMPERATURE', 106, '°F').disposition).toBe('EMERGENCY');
    expect(evaluateVital('TEMPERATURE', 30, '°C').disposition).toBe('EMERGENCY');
    expect(evaluateVital('TEMPERATURE', 39.5, '°C').disposition).toBe('URGENT');
    expect(evaluateVital('TEMPERATURE', 34, '°C').disposition).toBe('URGENT');
    expect(evaluateVital('TEMPERATURE', 37, '°C').disposition).toBe('ROUTINE');
  });

  it('every non-routine finding carries a citation', () => {
    const e = evaluateVital('GLUCOSE', 45, 'mg/dL');
    expect(e.findings.every((f) => f.citation.length > 0)).toBe(true);
  });
});

describe('lab red-flag escalation', () => {
  it('grades potassium: >=6.5 & <2.5 EMERGENCY; 5.5-6.4 & 2.5-3.4 URGENT', () => {
    expect(evaluateLab('POTASSIUM', 6.8).disposition).toBe('EMERGENCY');
    expect(evaluateLab('POTASSIUM', 2.2).disposition).toBe('EMERGENCY');
    expect(evaluateLab('POTASSIUM', 5.7).disposition).toBe('URGENT');
    expect(evaluateLab('POTASSIUM', 3.2).disposition).toBe('URGENT');
    expect(evaluateLab('POTASSIUM', 4.2).disposition).toBe('ROUTINE');
  });

  it('flags eGFR G5 (<15) and G4 (15-29) as URGENT', () => {
    expect(evaluateLab('EGFR', 12).disposition).toBe('URGENT');
    expect(evaluateLab('EGFR', 20).disposition).toBe('URGENT');
    expect(evaluateLab('EGFR', 65).disposition).toBe('ROUTINE');
  });

  it('flags severe LDL and triglycerides as URGENT', () => {
    expect(evaluateLab('LDL', 200).disposition).toBe('URGENT');
    expect(evaluateLab('TRIGLYCERIDES', 600).disposition).toBe('URGENT');
  });

  it('treats HbA1c as routine (chronic, not an acute red flag)', () => {
    expect(evaluateLab('HBA1C', 9).disposition).toBe('ROUTINE');
  });
});

describe('symptom + vital co-occurrence (merge)', () => {
  it('escalates a crisis-range BP WITH chest pain to EMERGENCY', () => {
    const merged = mergeEvaluations(
      evaluateVital('BLOOD_PRESSURE', 190, 'mmHg', 125),
      evaluateSymptoms(['chest-pain']),
    );
    expect(merged.disposition).toBe('EMERGENCY');
    // Both findings are retained.
    expect(merged.findings.length).toBeGreaterThanOrEqual(2);
  });
});

describe('symptom escalation', () => {
  it('escalates chest pain to EMERGENCY', () => {
    expect(evaluateSymptoms(['chest-pain']).disposition).toBe('EMERGENCY');
  });
  it('treats sudden confusion and the DKA pattern as EMERGENCY', () => {
    expect(evaluateSymptoms(['confusion']).disposition).toBe('EMERGENCY');
    expect(evaluateSymptoms(['dka-pattern']).disposition).toBe('EMERGENCY');
  });

  it('takes the most urgent across symptoms and ignores unknown codes', () => {
    expect(evaluateSymptoms(['confusion', 'chest-pain']).disposition).toBe('EMERGENCY');
    expect(evaluateSymptoms(['not-real']).disposition).toBe('ROUTINE');
  });
});

describe('reference comparison', () => {
  it('reports above/in/below vs the reference range', () => {
    expect(compareToRange(VITAL_REFERENCE.GLUCOSE, 200)).toBe('above');
    expect(compareToRange(VITAL_REFERENCE.GLUCOSE, 100)).toBe('in-range');
    expect(compareToRange(VITAL_REFERENCE.GLUCOSE, 60)).toBe('below');
  });
});
