'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit/audit';
import {
  createAllergy,
  createCondition,
  createEncounter,
  createMedication,
  softDeleteRecord,
} from '@/lib/data/records';
import {
  allergySchema,
  conditionSchema,
  encounterSchema,
  medicationSchema,
  type AllergyInput,
  type ConditionInput,
  type EncounterInput,
  type MedicationInput,
} from '@/lib/validation/records';
import type { FormResult } from '@/lib/actions/profile';

function toFieldErrors(flat: Record<string, string[] | undefined>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(flat)) if (v?.[0]) out[k] = v[0];
  return out;
}

export async function addConditionAction(
  input: ConditionInput,
): Promise<FormResult> {
  const user = await requireUser();
  const parsed = conditionSchema.safeParse(input);
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors) };
  const created = await createCondition(user.id, parsed.data);
  await recordAudit({ userId: user.id, action: 'CREATE', entityType: 'Condition', entityId: created.id });
  revalidatePath('/records/conditions');
  return { ok: true };
}

export async function addMedicationAction(
  input: MedicationInput,
): Promise<FormResult> {
  const user = await requireUser();
  const parsed = medicationSchema.safeParse(input);
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors) };
  const created = await createMedication(user.id, parsed.data);
  await recordAudit({ userId: user.id, action: 'CREATE', entityType: 'Medication', entityId: created.id });
  revalidatePath('/records/medications');
  return { ok: true };
}

export async function addAllergyAction(
  input: AllergyInput,
): Promise<FormResult> {
  const user = await requireUser();
  const parsed = allergySchema.safeParse(input);
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors) };
  const created = await createAllergy(user.id, parsed.data);
  await recordAudit({ userId: user.id, action: 'CREATE', entityType: 'Allergy', entityId: created.id });
  revalidatePath('/records/allergies');
  return { ok: true };
}

export async function addEncounterAction(
  input: EncounterInput,
): Promise<FormResult> {
  const user = await requireUser();
  const parsed = encounterSchema.safeParse(input);
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors) };
  const created = await createEncounter(user.id, parsed.data);
  await recordAudit({ userId: user.id, action: 'CREATE', entityType: 'Encounter', entityId: created.id });
  revalidatePath('/records/encounters');
  return { ok: true };
}

export async function deleteRecordAction(
  model: 'condition' | 'medication' | 'allergy' | 'encounter',
  id: string,
): Promise<FormResult> {
  const user = await requireUser();
  const ok = await softDeleteRecord(user.id, model, id);
  if (!ok) return { error: 'Not found.' };
  await recordAudit({
    userId: user.id,
    action: 'DELETE',
    entityType: model,
    entityId: id,
  });
  revalidatePath(`/records/${model === 'medication' ? 'medications' : model === 'allergy' ? 'allergies' : model === 'encounter' ? 'encounters' : 'conditions'}`);
  return { ok: true };
}
