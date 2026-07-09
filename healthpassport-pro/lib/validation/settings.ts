import { z } from 'zod';

/** User preferences (docs/DATABASE_SCHEMA.md — UserSettings). */
export const settingsSchema = z.object({
  locale: z.enum(['en', 'es', 'fr', 'ar']),
  theme: z.enum(['light', 'dark', 'system']),
  unitsSystem: z.enum(['METRIC', 'IMPERIAL']),
  notificationsEnabled: z.boolean(),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

/** Change-password form. New password mirrors the registration policy. */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .max(200, 'That password is too long.'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
