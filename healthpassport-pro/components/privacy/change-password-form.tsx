'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  passwordChangeSchema,
  type PasswordChangeInput,
} from '@/lib/validation/settings';
import { changePasswordAction } from '@/lib/actions/account';
import { Field } from '@/components/forms/field';
import { FormError, FormSuccess } from '@/components/forms/form-error';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [serverFieldErrors, setServerFieldErrors] = useState<
    Record<string, string>
  >({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const errorOf = (name: keyof PasswordChangeInput) =>
    (errors[name]?.message as string | undefined) ?? serverFieldErrors[name];

  function onSubmit(values: PasswordChangeInput) {
    setServerError(undefined);
    setSuccess(undefined);
    setServerFieldErrors({});
    startTransition(async () => {
      const res = await changePasswordAction(values);
      if (res.fieldErrors) setServerFieldErrors(res.fieldErrors);
      else if (res.error) setServerError(res.error);
      else {
        setSuccess('Your password was changed.');
        reset();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormSuccess message={success} />
      <FormError message={serverError} />
      <Field id="cp-current" label="Current password" required error={errorOf('currentPassword')}>
        <Input
          id="cp-current"
          type="password"
          autoComplete="current-password"
          {...register('currentPassword')}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cp-new" label="New password" required error={errorOf('newPassword')}>
          <Input
            id="cp-new"
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
          />
        </Field>
        <Field id="cp-confirm" label="Confirm new password" required error={errorOf('confirmPassword')}>
          <Input
            id="cp-confirm"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending && <Loader2 aria-hidden className="animate-spin" />}
          Change password
        </Button>
      </div>
    </form>
  );
}
