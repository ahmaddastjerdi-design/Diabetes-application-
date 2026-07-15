'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { encounterSchema, type EncounterInput } from '@/lib/validation/records';
import { addEncounterAction } from '@/lib/actions/records';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { NativeSelect } from '@/components/ui/select-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AddEncounterForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EncounterInput>({
    resolver: zodResolver(encounterSchema),
    defaultValues: { type: 'OFFICE', occurredAt: '' },
  });

  function onSubmit(values: EncounterInput) {
    setError(undefined);
    startTransition(async () => {
      const res = await addEncounterAction(values);
      if (res.error) setError(res.error);
      else if (res.ok) {
        reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <FormError message={error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="e-type" label="Type" error={errors.type?.message}>
          <NativeSelect id="e-type" {...register('type')}>
            <option value="OFFICE">Office visit</option>
            <option value="TELEHEALTH">Telehealth</option>
            <option value="LAB">Lab</option>
            <option value="HOSPITAL">Hospital</option>
            <option value="OTHER">Other</option>
          </NativeSelect>
        </Field>
        <Field id="e-date" label="Date" required error={errors.occurredAt?.message}>
          <Input id="e-date" type="date" {...register('occurredAt')} />
        </Field>
        <Field id="e-provider" label="Provider (optional)" error={errors.provider?.message}>
          <Input id="e-provider" placeholder="e.g. Dr. Lee" {...register('provider')} />
        </Field>
        <Field id="e-reason" label="Reason (optional)" error={errors.reason?.message}>
          <Input id="e-reason" {...register('reason')} />
        </Field>
      </div>
      <Field id="e-summary" label="Summary (optional)" error={errors.summary?.message}>
        <Input id="e-summary" {...register('summary')} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={pending} aria-busy={pending}>
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
          Add visit
        </Button>
      </div>
    </form>
  );
}
