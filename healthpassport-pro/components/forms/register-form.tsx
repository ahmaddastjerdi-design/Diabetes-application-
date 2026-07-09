'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction, type ActionState } from '@/lib/auth/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from './submit-button';
import { FieldError, FormError } from './form-error';

const initial: ActionState = {};

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError message={state.error} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby="email-error"
        />
        <FieldError id="email-error" message={state.fieldErrors?.email} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby="password-error password-hint"
        />
        <p id="password-hint" className="text-xs text-muted-foreground">
          Use at least 8 characters.
        </p>
        <FieldError id="password-error" message={state.fieldErrors?.password} />
      </div>
      <div className="flex items-start gap-2">
        <input
          id="acceptedTerms"
          name="acceptedTerms"
          type="checkbox"
          className="mt-1 size-4"
          aria-describedby="terms-error"
        />
        <Label htmlFor="acceptedTerms" className="text-sm font-normal">
          I agree to the{' '}
          <Link href="/terms" className="text-primary underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary underline">
            Privacy Policy
          </Link>
          , and I understand this app does not replace my physician.
        </Label>
      </div>
      <FieldError id="terms-error" message={state.fieldErrors?.acceptedTerms} />
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}
