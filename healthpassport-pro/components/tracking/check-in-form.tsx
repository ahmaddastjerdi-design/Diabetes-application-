'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { checkInSchema, type CheckInInput } from '@/lib/validation/tracking';
import { saveCheckInAction } from '@/lib/actions/tracking';
import { Field } from '@/components/forms/field';
import { FormSuccess } from '@/components/forms/form-error';
import { NativeSelect } from '@/components/ui/select-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function CheckInForm({ defaults }: { defaults?: Partial<CheckInInput> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckInInput>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      date: defaults?.date ?? today(),
      mood: defaults?.mood,
      medicationTaken: defaults?.medicationTaken,
      note: defaults?.note ?? '',
    },
  });

  function onSubmit(values: CheckInInput) {
    setSuccess(undefined);
    startTransition(async () => {
      const res = await saveCheckInAction(values);
      if (res.ok) {
        setSuccess('Check-in saved.');
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <FormSuccess message={success} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="ci-date" label="Date" error={errors.date?.message}>
          <Input id="ci-date" type="date" {...register('date')} />
        </Field>
        <Field id="ci-mood" label="How do you feel? (1–5)" error={errors.mood?.message}>
          <NativeSelect id="ci-mood" {...register('mood')}>
            <option value="">—</option>
            <option value="1">1 · Very low</option>
            <option value="2">2 · Low</option>
            <option value="3">3 · Okay</option>
            <option value="4">4 · Good</option>
            <option value="5">5 · Great</option>
          </NativeSelect>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4" {...register('medicationTaken')} />
        I took my medications today
      </label>
      <Field id="ci-note" label="Anything to note? (optional)" error={errors.note?.message}>
        <Input id="ci-note" {...register('note')} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending && <Loader2 aria-hidden className="animate-spin" />}
          Save check-in
        </Button>
      </div>
    </form>
  );
}
