'use client';

import { useActionState } from 'react';
import { forgotPasswordAction, type ActionState } from '@/lib/auth/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from './submit-button';
import { FieldError, FormSuccess } from './form-error';

const initial: ActionState = {};

export function ForgotForm() {
  const [state, action] = useActionState(forgotPasswordAction, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormSuccess message={state.success} />
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
      <SubmitButton>Send reset link</SubmitButton>
    </form>
  );
}
