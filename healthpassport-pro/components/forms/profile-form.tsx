'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, type ProfileInput } from '@/lib/validation/profile';
import { saveProfileAction } from '@/lib/actions/profile';
import { ProfileFields } from './profile-fields';
import { FormError, FormSuccess } from './form-error';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function ProfileForm({ defaultValues }: { defaultValues: ProfileInput }) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [serverFieldErrors, setServerFieldErrors] = useState<
    Record<string, string>
  >({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const errorOf = (name: keyof ProfileInput) =>
    (errors[name]?.message as string | undefined) ?? serverFieldErrors[name];

  function onSubmit(values: ProfileInput) {
    setServerError(undefined);
    setSuccess(undefined);
    setServerFieldErrors({});
    startTransition(async () => {
      const res = await saveProfileAction(values);
      if (res.fieldErrors) setServerFieldErrors(res.fieldErrors);
      else if (res.error) setServerError(res.error);
      else setSuccess('Your details were saved.');
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormSuccess message={success} />
      <FormError message={serverError} />
      <ProfileFields register={register} errorOf={errorOf} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending && <Loader2 aria-hidden className="animate-spin" />}
          Save details
        </Button>
      </div>
    </form>
  );
}
