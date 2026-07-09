import { describe, expect, it } from 'vitest';
import {
  emergencyContactSchema,
  profileSchema,
} from '@/lib/validation/profile';

describe('profileSchema', () => {
  it('accepts an empty profile (all fields optional)', () => {
    expect(profileSchema.safeParse({}).success).toBe(true);
  });

  it('coerces height and defaults units to metric', () => {
    const r = profileSchema.safeParse({ heightCm: '175' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.heightCm).toBe(175);
      expect(r.data.unitsSystem).toBe('METRIC');
    }
  });

  it('rejects an implausible height and a malformed date', () => {
    expect(profileSchema.safeParse({ heightCm: 5 }).success).toBe(false);
    expect(profileSchema.safeParse({ birthDate: '01-01-1980' }).success).toBe(false);
  });

  it('normalizes empty strings to undefined', () => {
    const r = profileSchema.safeParse({ givenName: '', birthDate: '' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.givenName).toBeUndefined();
      expect(r.data.birthDate).toBeUndefined();
    }
  });
});

describe('emergencyContactSchema', () => {
  it('requires a name and a valid phone', () => {
    expect(
      emergencyContactSchema.safeParse({ name: '', phone: '123' }).success,
    ).toBe(false);
    expect(
      emergencyContactSchema.safeParse({ name: 'Alex', phone: 'abc' }).success,
    ).toBe(false);
    expect(
      emergencyContactSchema.safeParse({ name: 'Alex', phone: '+1 (555) 123-4567' })
        .success,
    ).toBe(true);
  });
});
