'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { allergySchema, type AllergyInput } from '@/lib/validation/records';
import { addAllergyAction } from '@/lib/actions/records';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { NativeSelect } from '@/components/ui/select-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AddAllergyForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AllergyInput>({
    resolver: zodResolver(allergySchema),
    defaultValues: { substance: '', criticality: 'UNABLE_TO_ASSESS' },
  });

  function onSubmit(values: AllergyInput) {
    setError(undefined);
    startTransition(async () => {
      const res = await addAllergyAction(values);
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
        <Field id="a-sub" label="Substance" required error={errors.substance?.message}>
          <Input id="a-sub" placeholder="e.g. Penicillin" {...register('substance')} />
        </Field>
        <Field id="a-crit" label="Severity" error={errors.criticality?.message}>
          <NativeSelect id="a-crit" {...register('criticality')}>
            <option value="HIGH">High</option>
            <option value="LOW">Low</option>
            <option value="UNABLE_TO_ASSESS">Not sure</option>
          </NativeSelect>
        </Field>
        <Field id="a-react" label="Reaction (optional)" error={errors.reaction?.message}>
          <Input id="a-react" placeholder="e.g. rash, swelling" {...register('reaction')} />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={pending} aria-busy={pending}>
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
          Add allergy
        </Button>
      </div>
    </form>
  );
}
