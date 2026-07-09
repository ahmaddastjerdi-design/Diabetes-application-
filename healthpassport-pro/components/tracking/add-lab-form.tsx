'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { labSchema, LAB_TYPES, type LabInput } from '@/lib/validation/tracking';
import { addLabAction, type TrackResult } from '@/lib/actions/tracking';
import { LAB_META } from '@/lib/clinical/measurements';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { SafetyAlert } from '@/components/safety/safety-alert';
import { NativeSelect } from '@/components/ui/select-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function todayLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddLabForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<TrackResult['evaluation']>();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LabInput>({
    resolver: zodResolver(labSchema),
    defaultValues: { type: 'HBA1C', unit: '%', recordedAt: todayLocal() },
  });

  const type = watch('type');
  const meta = LAB_META[type];

  useEffect(() => {
    setValue('unit', meta.units[0]!);
  }, [type, meta.units, setValue]);

  function onSubmit(values: LabInput) {
    setError(undefined);
    setResult(undefined);
    startTransition(async () => {
      const res = await addLabAction(values);
      if (res.error) setError(res.error);
      else if (res.ok) {
        setResult(res.evaluation);
        reset({ type: values.type, unit: values.unit, recordedAt: todayLocal() });
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <FormError message={error} />
      {result && result.disposition !== 'ROUTINE' && <SafetyAlert evaluation={result} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="l-type" label="Lab test" error={errors.type?.message}>
          <NativeSelect id="l-type" {...register('type')}>
            {LAB_TYPES.map((t) => (
              <option key={t} value={t}>
                {LAB_META[t].label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="l-value" label="Result" required error={errors.value?.message}>
          <div className="flex gap-2">
            <Input id="l-value" type="number" inputMode="decimal" step="any" {...register('value')} />
            {meta.units.length > 1 ? (
              <NativeSelect aria-label="Unit" className="w-28" {...register('unit')}>
                {meta.units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </NativeSelect>
            ) : (
              <span className="flex items-center px-2 text-sm text-muted-foreground">
                {meta.units[0]}
              </span>
            )}
          </div>
        </Field>
        <Field id="l-when" label="Date" error={errors.recordedAt?.message}>
          <Input id="l-when" type="datetime-local" {...register('recordedAt')} />
        </Field>
        <Field id="l-notes" label="Note (optional)" error={errors.notes?.message}>
          <Input id="l-notes" {...register('notes')} />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
          Add result
        </Button>
      </div>
    </form>
  );
}
