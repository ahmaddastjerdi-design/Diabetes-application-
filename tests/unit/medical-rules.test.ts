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

  it('every finding cites a named guideline or an explicit pending-CSO marker', () => {
    // A safety-relevant gate: a bare numeric restatement must NOT pass
    // (docs/MEDICAL_SAFETY_RULES.md §6). Require a recognizable source token.
    const CITE = /ADA|ACC|AHA|ASA|KDIGO|NEWS2|RCP|ERC|WHO|NCEP|Endocrine|clinical refs|app safety anchor|pending CSO/i;
    const findings = [
      ...evaluateVital('GLUCOSE', 45, 'mg/dL').findings,
      ...evaluateVital('GLUCOSE', 420, 'mg/dL').findings,
      ...evaluateVital('BLOOD_PRESSURE', 185, 'mmHg', 125).findings,
      ...evaluateVital('BLOOD_PRESSURE', 85, 'mmHg', 55).findings,
      ...evaluateVital('SPO2', 86, '%').findings,
      ...evaluateVital('SPO2', 91, '%').findings,
      ...evaluateVital('HEART_RATE', 135, 'bpm').findings,
      ...evaluateVital('TEMPERATURE', 30, '°C').findings,
      ...evaluateVital('TEMPERATURE', 42, '°C').findings,
      ...evaluateVital('TEMPERATURE', 34, '°C').findings,
      ...evaluateLab('POTASSIUM', 6.8).findings,
      ...evaluateLab('POTASSIUM', 2.2).findings,
      ...evaluateLab('POTASSIUM', 3.2).findings,
      ...evaluateLab('EGFR', 12).findings,
      ...evaluateLab('LDL', 200).findings,
      ...evaluateLab('TRIGLYCERIDES', 600).findings,
      ...evaluateSymptoms(['chest-pain', 'stroke-fast', 'severe-dyspnea', 'syncope', 'thunderclap-headache', 'dka-pattern', 'confusion']).findings,
    ];
    expect(findings.length).toBeGreaterThan(15);
    for (const f of findings) {
      expect(f.citation, `${f.code}: "${f.citation}"`).toMatch(CITE);
    }
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
