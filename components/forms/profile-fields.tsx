'use client';

import type { UseFormRegister } from 'react-hook-form';
import type { ProfileInput } from '@/lib/validation/profile';
import { Field } from './field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select-native';

/** Shared profile fields, used by the profile page and the onboarding wizard. */
export function ProfileFields({
  register,
  errorOf,
}: {
  register: UseFormRegister<ProfileInput>;
  errorOf: (name: keyof ProfileInput) => string | undefined;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="givenName" label="First name" error={errorOf('givenName')}>
        <Input id="givenName" autoComplete="given-name" {...register('givenName')} />
      </Field>
      <Field id="familyName" label="Last name" error={errorOf('familyName')}>
        <Input id="familyName" autoComplete="family-name" {...register('familyName')} />
      </Field>
      <Field id="birthDate" label="Date of birth" error={errorOf('birthDate')}>
        <Input id="birthDate" type="date" {...register('birthDate')} />
      </Field>
      <Field id="sex" label="Sex" error={errorOf('sex')}>
        <NativeSelect id="sex" defaultValue="prefer_not" {...register('sex')}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not">Prefer not to say</option>
        </NativeSelect>
      </Field>
      <Field
        id="heightCm"
        label="Height (cm)"
        hint="Used to contextualize weight and BMI."
        error={errorOf('heightCm')}
      >
        <Input id="heightCm" type="number" inputMode="numeric" {...register('heightCm')} />
      </Field>
      <Field id="unitsSystem" label="Units" error={errorOf('unitsSystem')}>
        <NativeSelect id="unitsSystem" defaultValue="METRIC" {...register('unitsSystem')}>
          <option value="METRIC">Metric (kg, cm, mmol/L)</option>
          <option value="IMPERIAL">Imperial (lb, in, mg/dL)</option>
        </NativeSelect>
      </Field>
      <Field id="preferredLanguage" label="Preferred language" error={errorOf('preferredLanguage')}>
        <NativeSelect
          id="preferredLanguage"
          defaultValue="en"
          {...register('preferredLanguage')}
        >
          <option value="en">English</option>
          <option value="fa">فارسی</option>
        </NativeSelect>
      </Field>
    </div>
  );
}
