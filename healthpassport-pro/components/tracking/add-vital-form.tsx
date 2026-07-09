'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { vitalSchema, VITAL_TYPES, type VitalInput } from '@/lib/validation/tracking';
import { addVitalAction, type TrackResult } from '@/lib/actions/tracking';
import { VITAL_META } from '@/lib/clinical/measurements';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { SafetyAlert } from '@/components/safety/safety-alert';
import { NativeSelect } from '@/components/ui/select-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function nowLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddVitalForm() {
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
  } = useForm<VitalInput>({
    resolver: zodResolver(vitalSchema),
    defaultValues: { type: 'BLOOD_PRESSURE', unit: 'mmHg', recordedAt: nowLocal() },
  });

  const type = watch('type');
  const meta = VITAL_META[type];
  const isBp = type === 'BLOOD_PRESSURE';

  // Keep the unit valid when the measurement type changes.
  useEffect(() => {
    setValue('unit', meta.units[0]!);
  }, [type, meta.units, setValue]);

  function onSubmit(values: VitalInput) {
    setError(undefined);
    setResult(undefined);
    startTransition(async () => {
      const res = await addVitalAction(values);
      if (res.error) setError(res.error);
      else if (res.ok) {
        setResult(res.evaluation);
        reset({ type: values.type, unit: values.unit, recordedAt: nowLocal() });
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <FormError message={error} />
      {result && result.disposition !== 'ROUTINE' && <SafetyAlert evaluation={result} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="v-type" label="Measurement" error={errors.type?.message}>
          <NativeSelect id="v-type" {...register('type')}>
            {VITAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {VITAL_META[t].label}
              </option>
            ))}
          </NativeSelect>
        </Field>

        {isBp ? (
          <div className="grid grid-cols-2 gap-3">
            <Field id="v-sys" label="Systolic" required error={errors.value?.message}>
              <Input id="v-sys" type="number" inputMode="numeric" {...register('value')} />
            </Field>
            <Field id="v-dia" label="Diastolic" required error={errors.value2?.message}>
              <Input id="v-dia" type="number" inputMode="numeric" {...register('value2')} />
            </Field>
          </div>
        ) : (
          <Field id="v-value" label="Value" required error={errors.value?.message}>
            <div className="flex gap-2">
              <Input id="v-value" type="number" inputMode="decimal" step="any" {...register('value')} />
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
        )}

        <Field id="v-when" label="When" error={errors.recordedAt?.message}>
          <Input id="v-when" type="datetime-local" {...register('recordedAt')} />
        </Field>
        <Field id="v-notes" label="Note (optional)" error={errors.notes?.message}>
          <Input id="v-notes" {...register('notes')} />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
          Add reading
        </Button>
      </div>
    </form>
  );
}
