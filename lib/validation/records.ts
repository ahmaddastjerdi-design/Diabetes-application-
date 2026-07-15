import { z } from 'zod';

const note = z
  .string()
  .trim()
  .max(500, 'Too long')
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v : undefined));

const optDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v : undefined));

export const conditionSchema = z.object({
  conditionKey: z.string().min(1, 'Choose a condition'),
  clinicalStatus: z
    .enum(['ACTIVE', 'RESOLVED', 'REMISSION', 'INACTIVE'])
    .default('ACTIVE'),
  onsetDate: optDate,
  notes: note,
});
export type ConditionInput = z.infer<typeof conditionSchema>;

export const medicationSchema = z.object({
  name: z.string().trim().min(1, 'Enter a medication').max(200),
  dosageText: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
  status: z.enum(['ACTIVE', 'STOPPED', 'COMPLETED']).default('ACTIVE'),
  startDate: optDate,
  notes: note,
});
export type MedicationInput = z.infer<typeof medicationSchema>;

export const allergySchema = z.object({
  substance: z.string().trim().min(1, 'Enter a substance').max(200),
  criticality: z.enum(['LOW', 'HIGH', 'UNABLE_TO_ASSESS']).default('UNABLE_TO_ASSESS'),
  reaction: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
  notes: note,
});
export type AllergyInput = z.infer<typeof allergySchema>;

export const encounterSchema = z.object({
  type: z.enum(['OFFICE', 'TELEHEALTH', 'LAB', 'HOSPITAL', 'OTHER']).default('OFFICE'),
  occurredAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date'),
  provider: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
  reason: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
  summary: note,
});
export type EncounterInput = z.infer<typeof encounterSchema>;
