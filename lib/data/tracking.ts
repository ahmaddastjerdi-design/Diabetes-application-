import { prisma } from '@/lib/db/prisma';
import type {
  CheckInInput,
  LabInput,
  SymptomInput,
  VitalInput,
} from '@/lib/validation/tracking';

// All scoped by userId, honoring soft delete. See SECURITY_CHECKLIST §2.

// ── Vitals ──
export function listVitals(userId: string, take = 200) {
  return prisma.vitalObservation.findMany({
    where: { userId, deletedAt: null },
    orderBy: { recordedAt: 'desc' },
    take,
  });
}

export function createVital(userId: string, input: VitalInput) {
  return prisma.vitalObservation.create({
    data: {
      userId,
      type: input.type,
      valueNumeric: input.value,
      valueSecondary: input.value2 ?? null,
      unit: input.unit,
      recordedAt: new Date(input.recordedAt),
      notes: input.notes ?? null,
    },
  });
}

// ── Labs ──
export function listLabs(userId: string, take = 200) {
  return prisma.labResult.findMany({
    where: { userId, deletedAt: null },
    orderBy: { recordedAt: 'desc' },
    take,
  });
}

export function createLab(userId: string, input: LabInput) {
  return prisma.labResult.create({
    data: {
      userId,
      type: input.type,
      value: input.value,
      unit: input.unit,
      recordedAt: new Date(input.recordedAt),
      notes: input.notes ?? null,
    },
  });
}

// ── Symptoms ──
export function listSymptoms(userId: string, take = 100) {
  return prisma.symptomEntry.findMany({
    where: { userId, deletedAt: null },
    orderBy: { recordedAt: 'desc' },
    take,
  });
}

export function createSymptom(userId: string, input: SymptomInput) {
  return prisma.symptomEntry.create({
    data: {
      userId,
      description: input.description,
      severity: input.severity ?? null,
      redFlagCodes: input.redFlagCodes,
      recordedAt: new Date(input.recordedAt),
      notes: input.notes ?? null,
    },
  });
}

// ── Daily check-in (one per day) ──
export function listCheckIns(userId: string, take = 30) {
  return prisma.dailyCheckIn.findMany({
    where: { userId, deletedAt: null },
    orderBy: { date: 'desc' },
    take,
  });
}

export function upsertCheckIn(userId: string, input: CheckInInput) {
  const date = new Date(input.date);
  return prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId,
      date,
      mood: input.mood ?? null,
      medicationTaken: input.medicationTaken ?? null,
      note: input.note ?? null,
    },
    update: {
      mood: input.mood ?? null,
      medicationTaken: input.medicationTaken ?? null,
      note: input.note ?? null,
    },
  });
}

type TrackModel = 'vital' | 'lab' | 'symptom';

export async function softDeleteTracking(
  userId: string,
  model: TrackModel,
  id: string,
): Promise<boolean> {
  const data = { deletedAt: new Date() };
  const where = { id, userId, deletedAt: null };
  const res =
    model === 'vital'
      ? await prisma.vitalObservation.updateMany({ where, data })
      : model === 'lab'
        ? await prisma.labResult.updateMany({ where, data })
        : await prisma.symptomEntry.updateMany({ where, data });
  return res.count > 0;
}
