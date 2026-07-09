import { z } from 'zod';

const optNote = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v : undefined));

// datetime-local yields 'YYYY-MM-DDTHH:mm'.
const dateTime = z.string().min(1, 'Enter a date and time');

export const VITAL_TYPES = [
  'BLOOD_PRESSURE',
  'GLUCOSE',
  'WEIGHT',
  'HEART_RATE',
  'TEMPERATURE',
  'SPO2',
  'WAIST',
] as const;

export const vitalSchema = z
  .object({
    type: z.enum(VITAL_TYPES),
    value: z.coerce.number({ invalid_type_error: 'Enter a number' }).finite(),
    value2: z.coerce.number().finite().optional().or(z.nan().transform(() => undefined)),
    unit: z.string().min(1),
    recordedAt: dateTime,
    notes: optNote,
  })
  .superRefine((v, ctx) => {
    if (v.type === 'BLOOD_PRESSURE' && (v.value2 === undefined || Number.isNaN(v.value2))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['value2'], message: 'Enter diastolic' });
    }
  });
export type VitalInput = z.infer<typeof vitalSchema>;

export const LAB_TYPES = [
  'HBA1C',
  'LDL',
  'HDL',
  'TRIGLYCERIDES',
  'TOTAL_CHOLESTEROL',
  'CREATININE',
  'EGFR',
  'UACR',
  'POTASSIUM',
] as const;

export const labSchema = z.object({
  type: z.enum(LAB_TYPES),
  value: z.coerce.number({ invalid_type_error: 'Enter a number' }).finite(),
  unit: z.string().min(1),
  recordedAt: dateTime,
  notes: optNote,
});
export type LabInput = z.infer<typeof labSchema>;

export const symptomSchema = z.object({
  description: z.string().trim().min(1, 'Describe the symptom').max(300),
  severity: z.coerce.number().int().min(1).max(10).optional().or(z.nan().transform(() => undefined)),
  redFlagCodes: z.array(z.string()).default([]),
  recordedAt: dateTime,
  notes: optNote,
});
export type SymptomInput = z.infer<typeof symptomSchema>;

export const checkInSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date'),
  mood: z.coerce.number().int().min(1).max(5).optional().or(z.nan().transform(() => undefined)),
  medicationTaken: z.boolean().optional(),
  note: optNote,
});
export type CheckInInput = z.infer<typeof checkInSchema>;
