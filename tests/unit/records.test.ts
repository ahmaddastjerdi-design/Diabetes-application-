import { describe, expect, it } from 'vitest';
import {
  allergySchema,
  conditionSchema,
  encounterSchema,
  medicationSchema,
} from '@/lib/validation/records';
import { CONDITION_CATALOG, findCondition } from '@/lib/clinical/conditions';

describe('condition catalog', () => {
  it('dual-codes every entry with SNOMED and ICD-10', () => {
    for (const c of CONDITION_CATALOG) {
      expect(c.snomed).toMatch(/^\d+$/);
      expect(c.icd10.length).toBeGreaterThan(0);
    }
  });
  it('resolves a known condition and its care module', () => {
    expect(findCondition('type2-diabetes')?.careModule).toBe('diabetes');
    expect(findCondition('nope')).toBeUndefined();
  });
});

describe('record schemas', () => {
  it('condition requires a catalog key and defaults to ACTIVE', () => {
    expect(conditionSchema.safeParse({ conditionKey: '' }).success).toBe(false);
    const r = conditionSchema.safeParse({ conditionKey: 'hypertension' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.clinicalStatus).toBe('ACTIVE');
  });

  it('medication requires a name', () => {
    expect(medicationSchema.safeParse({ name: '' }).success).toBe(false);
    expect(medicationSchema.safeParse({ name: 'Metformin' }).success).toBe(true);
  });

  it('allergy requires a substance', () => {
    expect(allergySchema.safeParse({ substance: '' }).success).toBe(false);
    expect(allergySchema.safeParse({ substance: 'Penicillin' }).success).toBe(true);
  });

  it('encounter requires a valid date', () => {
    expect(encounterSchema.safeParse({ occurredAt: '' }).success).toBe(false);
    expect(
      encounterSchema.safeParse({ type: 'OFFICE', occurredAt: '2026-07-09' }).success,
    ).toBe(true);
  });
});
