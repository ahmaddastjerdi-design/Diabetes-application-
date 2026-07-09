'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { medicationSchema, type MedicationInput } from '@/lib/validation/records';
import { addMedicationAction } from '@/lib/actions/records';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { NativeSelect } from '@/components/ui/select-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AddMedicationForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedicationInput>({
    resolver: zodResolver(medicationSchema),
    defaultValues: { name: '', status: 'ACTIVE' },
  });

  function onSubmit(values: MedicationInput) {
    setError(undefined);
    startTransition(async () => {
      const res = await addMedicationAction(values);
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
        <Field id="m-name" label="Medication" required error={errors.name?.message}>
          <Input id="m-name" placeholder="e.g. Metformin" {...register('name')} />
        </Field>
        <Field id="m-dose" label="Dosage (optional)" error={errors.dosageText?.message}>
          <Input id="m-dose" placeholder="e.g. 500 mg twice daily" {...register('dosageText')} />
        </Field>
        <Field id="m-status" label="Status" error={errors.status?.message}>
          <NativeSelect id="m-status" {...register('status')}>
            <option value="ACTIVE">Currently taking</option>
            <option value="STOPPED">Stopped</option>
            <option value="COMPLETED">Completed</option>
          </NativeSelect>
        </Field>
        <Field id="m-start" label="Started (optional)" error={errors.startDate?.message}>
          <Input id="m-start" type="date" {...register('startDate')} />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={pending} aria-busy={pending}>
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
          Add medication
        </Button>
      </div>
    </form>
  );
}
