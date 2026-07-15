import { describe, expect, it } from 'vitest';
import {
  loginSchema,
  registerSchema,
} from '@/lib/validation/auth';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('registerSchema', () => {
  it('accepts a valid registration', () => {
    const r = registerSchema.safeParse({
      email: 'sam@example.com',
      password: 'a-strong-pass',
      acceptedTerms: true,
    });
    expect(r.success).toBe(true);
  });

  it('rejects a short password', () => {
    const r = registerSchema.safeParse({
      email: 'sam@example.com',
      password: 'short',
      acceptedTerms: true,
    });
    expect(r.success).toBe(false);
  });

  it('requires accepting the terms', () => {
    const r = registerSchema.safeParse({
      email: 'sam@example.com',
      password: 'a-strong-pass',
      acceptedTerms: false,
    });
    expect(r.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const r = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'a-strong-pass',
      acceptedTerms: true,
    });
    expect(r.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('requires email and password', () => {
    expect(loginSchema.safeParse({ email: '', password: '' }).success).toBe(false);
    expect(
      loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success,
    ).toBe(true);
  });
});

describe('password hashing', () => {
  it('hashes and verifies correctly, and rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(hash).not.toContain('correct');
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
    expect(await verifyPassword('wrong password', hash)).toBe(false);
  });
});
