import { z } from 'zod';

const optionalString = z
  .string()
  .trim()
  .max(120, 'Too long')
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v : undefined));

export const profileSchema = z.object({
  givenName: optionalString,
  familyName: optionalString,
  // HTML date input yields 'YYYY-MM-DD' or ''.
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
  sex: z.enum(['male', 'female', 'other', 'prefer_not']).optional(),
  preferredLanguage: z.enum(['en', 'fa']).optional(),
  // An empty number input yields '' (which Number() coerces to 0). Normalize
  // any empty/blank value to undefined *before* coercion so leaving height blank
  // is treated as "not provided" rather than 0 (which would fail min() and, in
  // the onboarding wizard, silently block the "Continue" step).
  heightCm: z.preprocess(
    (v) =>
      v === '' || v === null || v === undefined || Number.isNaN(v)
        ? undefined
        : v,
    z.coerce
      .number()
      .min(30, 'Check the value')
      .max(272, 'Check the value')
      .optional(),
  ),
  unitsSystem: z.enum(['METRIC', 'IMPERIAL']).default('METRIC'),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const emergencyContactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  relationship: optionalString,
  phone: z
    .string()
    .trim()
    .min(3, 'Enter a phone number')
    .max(40)
    .regex(/^[0-9+()\-\s]+$/, 'Enter a valid phone number'),
  isPrimary: z.boolean().default(false),
});

export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;
