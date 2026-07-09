'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit/audit';
import {
  createLab,
  createSymptom,
  createVital,
  listCheckIns,
  softDeleteTracking,
  upsertCheckIn,
} from '@/lib/data/tracking';
import {
  checkInSchema,
  labSchema,
  symptomSchema,
  vitalSchema,
  type CheckInInput,
  type LabInput,
  type SymptomInput,
  type VitalInput,
} from '@/lib/validation/tracking';
import {
  evaluateLab,
  evaluateSymptoms,
  evaluateVital,
  mergeEvaluations,
  type Disposition,
  type Finding,
} from '@/lib/medical-rules';

export interface TrackResult {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  evaluation?: { disposition: Disposition; findings: Finding[] };
}

function toFieldErrors(flat: Record<string, string[] | undefined>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(flat)) if (v?.[0]) out[k] = v[0];
  return out;
}

export async function addVitalAction(input: VitalInput): Promise<TrackResult> {
  const user = await requireUser();
  const parsed = vitalSchema.safeParse(input);
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors) };
  const v = parsed.data;
  const created = await createVital(user.id, v);
  await recordAudit({ userId: user.id, action: 'CREATE', entityType: 'VitalObservation', entityId: created.id });
  revalidatePath('/track/vitals');
  // Escalation merges the reading with any co-reported red-flag symptoms, so a
  // borderline value WITH a red-flag symptom reaches EMERGENCY (safety review).
  const evaluation = mergeEvaluations(
    evaluateVital(v.type, v.value, v.unit, v.value2),
    evaluateSymptoms(v.symptomCodes),
  );
  return { ok: true, evaluation };
}

export async function addLabAction(input: LabInput): Promise<TrackResult> {
  const user = await requireUser();
  const parsed = labSchema.safeParse(input);
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors) };
  const created = await createLab(user.id, parsed.data);
  await recordAudit({ userId: user.id, action: 'CREATE', entityType: 'LabResult', entityId: created.id });
  revalidatePath('/track/labs');
  return { ok: true, evaluation: evaluateLab(parsed.data.type, parsed.data.value) };
}

export async function addSymptomAction(input: SymptomInput): Promise<TrackResult> {
  const user = await requireUser();
  const parsed = symptomSchema.safeParse(input);
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors) };
  const evaluation = evaluateSymptoms(parsed.data.redFlagCodes);
  const created = await createSymptom(user.id, parsed.data);
  await recordAudit({ userId: user.id, action: 'CREATE', entityType: 'SymptomEntry', entityId: created.id });
  revalidatePath('/track/symptoms');
  return { ok: true, evaluation };
}

export async function saveCheckInAction(input: CheckInInput): Promise<TrackResult> {
  const user = await requireUser();
  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors) };
  await upsertCheckIn(user.id, parsed.data);
  await recordAudit({ userId: user.id, action: 'UPDATE', entityType: 'DailyCheckIn' });
  revalidatePath('/track/daily-checkin');
  return { ok: true };
}

export async function deleteTrackingAction(
  model: 'vital' | 'lab' | 'symptom',
  id: string,
): Promise<TrackResult> {
  const user = await requireUser();
  const ok = await softDeleteTracking(user.id, model, id);
  if (!ok) return { error: 'Not found.' };
  await recordAudit({ userId: user.id, action: 'DELETE', entityType: model, entityId: id });
  const path = model === 'vital' ? '/track/vitals' : model === 'lab' ? '/track/labs' : '/track/symptoms';
  revalidatePath(path);
  return { ok: true };
}

// Re-export for the check-in page to prefill today's entry if present.
export async function getRecentCheckIns() {
  const user = await requireUser();
  return listCheckIns(user.id);
}
