'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { conditionSchema, type ConditionInput } from '@/lib/validation/records';
import { addConditionAction } from '@/lib/actions/records';
import { CONDITION_CATALOG } from '@/lib/clinical/conditions';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { NativeSelect } from '@/components/ui/select-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AddConditionForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConditionInput>({
    resolver: zodResolver(conditionSchema),
    defaultValues: { conditionKey: '', clinicalStatus: 'ACTIVE' },
  });

  function onSubmit(values: ConditionInput) {
    setError(undefined);
    startTransition(async () => {
      const res = await addConditionAction(values);
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
        <Field id="c-key" label="Condition" required error={errors.conditionKey?.message}>
          <NativeSelect id="c-key" {...register('conditionKey')}>
            <option value="">Select…</option>
            {CONDITION_CATALOG.map((c) => (
              <option key={c.key} value={c.key}>
                {c.display}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="c-status" label="Status" error={errors.clinicalStatus?.message}>
          <NativeSelect id="c-status" {...register('clinicalStatus')}>
            <option value="ACTIVE">Active</option>
            <option value="REMISSION">In remission</option>
            <option value="RESOLVED">Resolved</option>
            <option value="INACTIVE">Inactive</option>
          </NativeSelect>
        </Field>
        <Field id="c-onset" label="Since (optional)" error={errors.onsetDate?.message}>
          <Input id="c-onset" type="date" {...register('onsetDate')} />
        </Field>
        <Field id="c-notes" label="Note (optional)" error={errors.notes?.message}>
          <Input id="c-notes" {...register('notes')} />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={pending} aria-busy={pending}>
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
          Add condition
        </Button>
      </div>
    </form>
  );
}
