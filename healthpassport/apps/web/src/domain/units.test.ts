import { describe, expect, it } from 'vitest';
import {
  celsiusToFahrenheit,
  estimatedA1cFromAvgGlucoseMgdl,
  glucoseMgdlToMmol,
  glucoseMmolToMgdl,
  kgToLb,
  lbToKg,
} from './units';

describe('unit conversions', () => {
  it('converts glucose mg/dL <-> mmol/L round-trip within tolerance', () => {
    expect(glucoseMgdlToMmol(180)).toBeCloseTo(10.0, 1);
    expect(glucoseMmolToMgdl(10)).toBe(180);
    // Round-trip stays close despite rounding.
    expect(glucoseMmolToMgdl(glucoseMgdlToMmol(126))).toBeGreaterThanOrEqual(124);
    expect(glucoseMmolToMgdl(glucoseMgdlToMmol(126))).toBeLessThanOrEqual(128);
  });

  it('converts weight kg <-> lb', () => {
    expect(kgToLb(70)).toBeCloseTo(154.3, 1);
    expect(lbToKg(154.3)).toBeCloseTo(70, 1);
  });

  it('converts temperature C -> F', () => {
    expect(celsiusToFahrenheit(37)).toBeCloseTo(98.6, 1);
  });

  it('estimates HbA1c from average glucose using the ADAG formula', () => {
    // eAG 154 mg/dL corresponds to ~7.0% A1c.
    expect(estimatedA1cFromAvgGlucoseMgdl(154)).toBeCloseTo(7.0, 1);
    expect(estimatedA1cFromAvgGlucoseMgdl(126)).toBeCloseTo(6.0, 1);
  });
});
