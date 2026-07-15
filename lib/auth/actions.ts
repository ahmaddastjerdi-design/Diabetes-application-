'use server';

import { AuthError } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { signIn, signOut } from '@/auth';
import { hashPassword } from '@/lib/auth/password';
import { recordAudit } from '@/lib/audit/audit';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
} from '@/lib/validation/auth';

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
}

/** The consent policy version captured at registration. */
const CONSENT_VERSION = 'v1';

/** A thrown Next.js redirect (from signIn's redirectTo) carries this digest. */
function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

function fieldErrorsFrom(
  flat: Record<string, string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(flat)) {
    if (msgs && msgs[0]) out[key] = msgs[0];
  }
  return out;
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    acceptedTerms: formData.get('acceptedTerms') === 'on',
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.flatten().fieldErrors) };
  }
  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'An account with this email already exists.' };
  }

  try {
    const passwordHash = await hashPassword(password);
    const grantedAt = new Date();
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: { create: {} },
        settings: { create: {} },
        consents: {
          create: [
            { type: 'TERMS', granted: true, version: CONSENT_VERSION, grantedAt },
            { type: 'PRIVACY', granted: true, version: CONSENT_VERSION, grantedAt },
            {
              type: 'MEDICAL_DISCLAIMER',
              granted: true,
              version: CONSENT_VERSION,
              grantedAt,
            },
          ],
        },
      },
    });
    await recordAudit({ userId: user.id, action: 'CREATE', entityType: 'User', entityId: user.id });
    await recordAudit({ userId: user.id, action: 'CONSENT_CHANGE', entityType: 'Consent' });
  } catch {
    return { error: 'Could not create your account. Please try again.' };
  }

  // Establish the session and go to onboarding. signIn throws a redirect.
  await signIn('credentials', { email, password, redirectTo: '/onboarding' });
  return {};
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.flatten().fieldErrors) };
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/dashboard',
    });
    return {};
  } catch (error) {
    if (isNextRedirect(error)) throw error; // success path
    if (error instanceof AuthError) {
      return { error: 'Incorrect email or password.' };
    }
    return { error: 'Something went wrong. Please try again.' };
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.flatten().fieldErrors) };
  }
  // Email delivery is added in a later phase. Always return the same message so
  // an attacker cannot learn whether an account exists (no user enumeration).
  return {
    success:
      'If an account exists for that email, we have sent a password reset link.',
  };
}
