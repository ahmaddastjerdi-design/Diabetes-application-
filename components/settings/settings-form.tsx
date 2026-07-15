'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';
import { settingsSchema, type SettingsInput } from '@/lib/validation/settings';
import { saveSettingsAction } from '@/lib/actions/settings';
import { Field } from '@/components/forms/field';
import { FormError, FormSuccess } from '@/components/forms/form-error';
import { NativeSelect } from '@/components/ui/select-native';
import { Button } from '@/components/ui/button';

export function SettingsForm({ defaultValues }: { defaultValues: SettingsInput }) {
  const { setTheme } = useTheme();
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
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  const errorOf = (name: keyof SettingsInput) =>
    (errors[name]?.message as string | undefined) ?? serverFieldErrors[name];

  function onSubmit(values: SettingsInput) {
    setServerError(undefined);
    setSuccess(undefined);
    setServerFieldErrors({});
    // Apply theme immediately so the change is visible before the round-trip.
    setTheme(values.theme);
    startTransition(async () => {
      const res = await saveSettingsAction(values);
      if (res.fieldErrors) setServerFieldErrors(res.fieldErrors);
      else if (res.error) setServerError(res.error);
      else setSuccess('Your preferences were saved.');
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormSuccess message={success} />
      <FormError message={serverError} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="s-units" label="Units" error={errorOf('unitsSystem')}>
          <NativeSelect id="s-units" {...register('unitsSystem')}>
            <option value="METRIC">Metric (kg, cm, °C)</option>
            <option value="IMPERIAL">Imperial (lb, in, °F)</option>
          </NativeSelect>
        </Field>

        <Field id="s-locale" label="Language" error={errorOf('locale')}>
          <NativeSelect id="s-locale" {...register('locale')}>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </NativeSelect>
        </Field>

        <Field id="s-theme" label="Theme" error={errorOf('theme')}>
          <NativeSelect id="s-theme" {...register('theme')}>
            <option value="system">Match system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </NativeSelect>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4"
          {...register('notificationsEnabled')}
        />
        Send me care reminders and check-in nudges
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending && <Loader2 aria-hidden className="animate-spin" />}
          Save preferences
        </Button>
      </div>
    </form>
  );
}
