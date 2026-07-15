'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { reminderSchema, type ReminderInput } from '@/lib/validation/reminders';
import { addReminderAction } from '@/lib/actions/reminders';
import { Field } from '@/components/forms/field';
import { FormError, FormSuccess } from '@/components/forms/form-error';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select-native';
import { Button } from '@/components/ui/button';

const TYPE_LABELS: Record<ReminderInput['type'], string> = {
  MEDICATION: 'Medication',
  MEASUREMENT: 'Measurement (e.g. blood pressure)',
  APPOINTMENT: 'Appointment',
  PREVENTIVE: 'Preventive care (e.g. screening)',
};

export function AddReminderForm({ medications }: { medications: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReminderInput>({
    resolver: zodResolver(reminderSchema),
    defaultValues: { type: 'MEDICATION', label: '', schedule: '' },
  });

  const errorOf = (n: keyof ReminderInput) =>
    (errors[n]?.message as string | undefined) ?? fieldErrors[n];

  function onSubmit(values: ReminderInput) {
    setError(undefined);
    setSuccess(undefined);
    setFieldErrors({});
    startTransition(async () => {
      const res = await addReminderAction(values);
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      else if (res.error) setError(res.error);
      else {
        setSuccess('Reminder added.');
        reset({ type: values.type, label: '', schedule: '' });
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <FormSuccess message={success} />
      <FormError message={error} />

      <Field id="r-type" label="Type" error={errorOf('type')}>
        <NativeSelect id="r-type" {...register('type')}>
          {(Object.keys(TYPE_LABELS) as ReminderInput['type'][]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field id="r-label" label="Reminder" required error={errorOf('label')}>
        <Input
          id="r-label"
          list="med-options"
          placeholder="e.g. Take Metformin 500 mg"
          {...register('label')}
        />
        {medications.length > 0 && (
          <datalist id="med-options">
            {medications.map((m) => (
              <option key={m} value={`Take ${m}`} />
            ))}
          </datalist>
        )}
      </Field>

      <Field id="r-schedule" label="Schedule" required error={errorOf('schedule')}>
        <Input id="r-schedule" placeholder="e.g. 8:00 AM & 8:00 PM daily" {...register('schedule')} />
      </Field>

      <Field id="r-notes" label="Note (optional)" error={errorOf('notes')}>
        <Input id="r-notes" {...register('notes')} />
      </Field>

      <Button type="submit" disabled={pending} aria-busy={pending} className="w-full">
        {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
        Add reminder
      </Button>
    </form>
  );
}
