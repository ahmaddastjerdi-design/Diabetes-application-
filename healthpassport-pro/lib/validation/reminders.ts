import { z } from 'zod';

const optNote = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v : undefined));

export const REMINDER_TYPES = [
  'MEDICATION',
  'MEASUREMENT',
  'APPOINTMENT',
  'PREVENTIVE',
] as const;

export const reminderSchema = z.object({
  type: z.enum(REMINDER_TYPES).default('MEDICATION'),
  label: z
    .string()
    .trim()
    .min(1, 'Enter what to be reminded about')
    .max(120, 'Too long'),
  schedule: z
    .string()
    .trim()
    .min(1, 'Enter a schedule, e.g. “8:00 AM daily”')
    .max(120, 'Too long'),
  notes: optNote,
});
export type ReminderInput = z.infer<typeof reminderSchema>;
