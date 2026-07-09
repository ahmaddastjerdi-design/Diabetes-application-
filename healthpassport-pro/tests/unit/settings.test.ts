import { describe, expect, it } from 'vitest';
import {
  settingsSchema,
  passwordChangeSchema,
} from '@/lib/validation/settings';

describe('settingsSchema', () => {
  it('accepts a valid preferences object', () => {
    const r = settingsSchema.safeParse({
      locale: 'en',
      theme: 'dark',
      unitsSystem: 'METRIC',
      notificationsEnabled: true,
    });
    expect(r.success).toBe(true);
  });

  it('rejects an unknown locale or theme', () => {
    expect(
      settingsSchema.safeParse({
        locale: 'xx',
        theme: 'dark',
        unitsSystem: 'METRIC',
        notificationsEnabled: true,
      }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({
        locale: 'en',
        theme: 'neon',
        unitsSystem: 'METRIC',
        notificationsEnabled: true,
      }).success,
    ).toBe(false);
  });

  it('rejects an invalid units system', () => {
    expect(
      settingsSchema.safeParse({
        locale: 'en',
        theme: 'system',
        unitsSystem: 'STONES',
        notificationsEnabled: false,
      }).success,
    ).toBe(false);
  });
});

describe('passwordChangeSchema', () => {
  it('requires new and confirm to match', () => {
    const r = passwordChangeSchema.safeParse({
      currentPassword: 'old-secret',
      newPassword: 'new-strong-pass',
      confirmPassword: 'different',
    });
    expect(r.success).toBe(false);
  });

  it('enforces a minimum new-password length', () => {
    const r = passwordChangeSchema.safeParse({
      currentPassword: 'old-secret',
      newPassword: 'short',
      confirmPassword: 'short',
    });
    expect(r.success).toBe(false);
  });

  it('accepts a valid matching change', () => {
    const r = passwordChangeSchema.safeParse({
      currentPassword: 'old-secret',
      newPassword: 'new-strong-pass',
      confirmPassword: 'new-strong-pass',
    });
    expect(r.success).toBe(true);
  });
});
