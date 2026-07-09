'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { symptomSchema, type SymptomInput } from '@/lib/validation/tracking';
import { addSymptomAction, type TrackResult } from '@/lib/actions/tracking';
import { RED_FLAG_SYMPTOMS } from '@/lib/medical-rules';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { SafetyAlert } from '@/components/safety/safety-alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function nowLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddSymptomForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<TrackResult['evaluation']>();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SymptomInput>({
    resolver: zodResolver(symptomSchema),
    defaultValues: { description: '', redFlagCodes: [], recordedAt: nowLocal() },
  });

  function onSubmit(values: SymptomInput) {
    setError(undefined);
    setResult(undefined);
    startTransition(async () => {
      const res = await addSymptomAction(values);
      if (res.error) setError(res.error);
      else if (res.ok) {
        setResult(res.evaluation);
        reset({ description: '', redFlagCodes: [], recordedAt: nowLocal() });
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormError message={error} />
      {result && result.disposition !== 'ROUTINE' && <SafetyAlert evaluation={result} />}

      <Field id="s-desc" label="What are you feeling?" required error={errors.description?.message}>
        <Input id="s-desc" placeholder="e.g. headache, tiredness" {...register('description')} />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-muted-foreground">
          Do you have any of these now? (check all that apply)
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {RED_FLAG_SYMPTOMS.map((s) => (
            <label key={s.code} className="flex items-start gap-2 rounded-md border p-2 text-sm">
              <input type="checkbox" value={s.code} className="mt-0.5 size-4" {...register('redFlagCodes')} />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="s-sev" label="Severity 1–10 (optional)" error={errors.severity?.message}>
          <Input id="s-sev" type="number" inputMode="numeric" min={1} max={10} {...register('severity')} />
        </Field>
        <Field id="s-when" label="When" error={errors.recordedAt?.message}>
          <Input id="s-when" type="datetime-local" {...register('recordedAt')} />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
          Log symptom
        </Button>
      </div>
    </form>
  );
}
