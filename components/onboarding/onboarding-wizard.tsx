'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { profileSchema, type ProfileInput } from '@/lib/validation/profile';
import { finishOnboardingAction } from '@/lib/actions/profile';
import { ProfileFields } from '@/components/forms/profile-fields';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { MedicalDisclaimer } from '@/components/safety/medical-disclaimer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Step = 'profile' | 'contact';

export function OnboardingWizard({ defaults }: { defaults: ProfileInput }) {
  const [step, setStep] = useState<Step>('profile');
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});

  const [contact, setContact] = useState({
    name: '',
    phone: '',
    relationship: '',
    isPrimary: true,
  });

  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
  });

  const errorOf = (name: keyof ProfileInput) =>
    (errors[name]?.message as string | undefined) ?? serverFieldErrors[name];

  async function toContact() {
    const ok = await trigger();
    if (ok) setStep('contact');
  }

  function finish() {
    setServerError(undefined);
    setServerFieldErrors({});
    const profile = getValues();
    startTransition(async () => {
      const res = await finishOnboardingAction({
        profile,
        contact: contact.name.trim()
          ? {
              name: contact.name.trim(),
              phone: contact.phone.trim(),
              relationship: contact.relationship.trim() || undefined,
              isPrimary: contact.isPrimary,
            }
          : undefined,
      });
      // On success the action redirects; only errors return here.
      if (res?.fieldErrors) {
        setServerFieldErrors(res.fieldErrors);
        setStep('profile');
      } else if (res?.error) {
        setServerError(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <MedicalDisclaimer />
      <FormError message={serverError} />

      {step === 'profile' ? (
        <Card>
          <CardHeader>
            <CardTitle>Step 1 — About you</CardTitle>
            <p className="text-sm text-muted-foreground">
              This personalizes your record and reports. You can change anything later.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={(e) => e.preventDefault()} noValidate>
              <ProfileFields register={register} errorOf={errorOf} />
            </form>
            <div className="flex justify-end">
              <Button type="button" onClick={toContact}>
                Continue <ArrowRight aria-hidden />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Step 2 — Emergency contact</CardTitle>
            <p className="text-sm text-muted-foreground">
              Optional, but recommended. Add someone your care team can reach.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="oc-name" label="Name">
                <Input
                  id="oc-name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                />
              </Field>
              <Field id="oc-phone" label="Phone">
                <Input
                  id="oc-phone"
                  type="tel"
                  inputMode="tel"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                />
              </Field>
              <Field id="oc-rel" label="Relationship">
                <Input
                  id="oc-rel"
                  placeholder="e.g. spouse"
                  value={contact.relationship}
                  onChange={(e) =>
                    setContact({ ...contact, relationship: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep('profile')}>
                <ArrowLeft aria-hidden /> Back
              </Button>
              <Button type="button" onClick={finish} disabled={pending} aria-busy={pending}>
                {pending && <Loader2 aria-hidden className="animate-spin" />}
                Finish setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
