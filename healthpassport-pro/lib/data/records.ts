import { prisma } from '@/lib/db/prisma';
import { findCondition } from '@/lib/clinical/conditions';
import type {
  AllergyInput,
  ConditionInput,
  EncounterInput,
  MedicationInput,
} from '@/lib/validation/records';

// All reads/writes are scoped by userId (patient-owned isolation) and honor
// soft delete (deletedAt: null). See docs/SECURITY_CHECKLIST.md §2.

// ── Conditions ──────────────────────────────────────────────
export function listConditions(userId: string) {
  return prisma.condition.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ clinicalStatus: 'asc' }, { createdAt: 'desc' }],
  });
}

export function createCondition(userId: string, input: ConditionInput) {
  const cat = findCondition(input.conditionKey);
  if (!cat) throw new Error('Unknown condition');
  return prisma.condition.create({
    data: {
      userId,
      code: cat.snomed,
      icd10: cat.icd10,
      display: cat.display,
      clinicalStatus: input.clinicalStatus,
      onsetDate: input.onsetDate ? new Date(input.onsetDate) : null,
      notes: input.notes ?? null,
    },
  });
}

// ── Medications ─────────────────────────────────────────────
export function listMedications(userId: string) {
  return prisma.medication.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });
}

export function createMedication(userId: string, input: MedicationInput) {
  return prisma.medication.create({
    data: {
      userId,
      name: input.name,
      dosageText: input.dosageText ?? null,
      status: input.status,
      startDate: input.startDate ? new Date(input.startDate) : null,
      notes: input.notes ?? null,
    },
  });
}

// ── Allergies ───────────────────────────────────────────────
export function listAllergies(userId: string) {
  return prisma.allergy.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

export function createAllergy(userId: string, input: AllergyInput) {
  return prisma.allergy.create({
    data: {
      userId,
      substance: input.substance,
      criticality: input.criticality,
      reaction: input.reaction ?? null,
      notes: input.notes ?? null,
    },
  });
}

// ── Encounters ──────────────────────────────────────────────
export function listEncounters(userId: string) {
  return prisma.encounter.findMany({
    where: { userId, deletedAt: null },
    orderBy: { occurredAt: 'desc' },
  });
}

export function createEncounter(userId: string, input: EncounterInput) {
  return prisma.encounter.create({
    data: {
      userId,
      type: input.type,
      occurredAt: new Date(input.occurredAt),
      provider: input.provider ?? null,
      reason: input.reason ?? null,
      summary: input.summary ?? null,
    },
  });
}

// ── Generic soft-delete (ownership-scoped) ──────────────────
type RecordModel = 'condition' | 'medication' | 'allergy' | 'encounter';

export async function softDeleteRecord(
  userId: string,
  model: RecordModel,
  id: string,
): Promise<boolean> {
  const data = { deletedAt: new Date() };
  const where = { id, userId, deletedAt: null };
  const res =
    model === 'condition'
      ? await prisma.condition.updateMany({ where, data })
      : model === 'medication'
        ? await prisma.medication.updateMany({ where, data })
        : model === 'allergy'
          ? await prisma.allergy.updateMany({ where, data })
          : await prisma.encounter.updateMany({ where, data });
  return res.count > 0;
}
