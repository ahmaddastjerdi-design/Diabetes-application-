'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2, Phone, Loader2 } from 'lucide-react';
import {
  emergencyContactSchema,
  type EmergencyContactInput,
} from '@/lib/validation/profile';
import {
  addEmergencyContactAction,
  removeEmergencyContactAction,
} from '@/lib/actions/profile';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface ContactView {
  id: string;
  name: string;
  relationship: string | null;
  phone: string;
  isPrimary: boolean;
}

export function EmergencyContacts({ initial }: { initial: ContactView[] }) {
  const [contacts, setContacts] = useState<ContactView[]>(initial);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmergencyContactInput>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: { name: '', relationship: '', phone: '', isPrimary: false },
  });

  function onAdd(values: EmergencyContactInput) {
    setServerError(undefined);
    startTransition(async () => {
      const res = await addEmergencyContactAction(values);
      if (res.error) {
        setServerError(res.error);
        return;
      }
      if (res.ok) {
        // Optimistic local add; server is source of truth on next load.
        setContacts((prev) => [
          ...prev.map((c) => (values.isPrimary ? { ...c, isPrimary: false } : c)),
          {
            id: `tmp-${prev.length}-${values.phone}`,
            name: values.name,
            relationship: values.relationship ?? null,
            phone: values.phone,
            isPrimary: values.isPrimary,
          },
        ]);
        reset();
      }
    });
  }

  function onRemove(id: string) {
    startTransition(async () => {
      await removeEmergencyContactAction(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      {contacts.length > 0 && (
        <ul className="divide-y rounded-md border">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">
                  <Phone aria-hidden className="size-4 text-primary" />
                  {c.name}
                  {c.isPrimary && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                      Primary
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {c.phone}
                  {c.relationship ? ` · ${c.relationship}` : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${c.name}`}
                onClick={() => onRemove(c.id)}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit(onAdd)} className="space-y-3" noValidate>
        <FormError message={serverError} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="ec-name" label="Name" required error={errors.name?.message}>
            <Input id="ec-name" {...register('name')} />
          </Field>
          <Field id="ec-phone" label="Phone" required error={errors.phone?.message}>
            <Input id="ec-phone" type="tel" inputMode="tel" {...register('phone')} />
          </Field>
          <Field id="ec-rel" label="Relationship" error={errors.relationship?.message}>
            <Input id="ec-rel" placeholder="e.g. spouse, child" {...register('relationship')} />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" className="size-4" {...register('isPrimary')} />
            Primary contact
          </label>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="secondary" disabled={pending} aria-busy={pending}>
            {pending && <Loader2 aria-hidden className="animate-spin" />}
            Add contact
          </Button>
        </div>
      </form>
    </div>
  );
}
