import { prisma } from '@/lib/db/prisma';
import type { EmergencyContactInput, ProfileInput } from '@/lib/validation/profile';

// Every function is scoped by `userId` — the patient-owned data-isolation
// boundary (docs/SECURITY_CHECKLIST.md §2). Callers pass the authenticated
// session user id; queries never span users.

export function getProfile(userId: string) {
  return prisma.patientProfile.findUnique({ where: { userId } });
}

export async function updateProfile(userId: string, input: ProfileInput) {
  const data = {
    givenName: input.givenName ?? null,
    familyName: input.familyName ?? null,
    birthDate: input.birthDate ? new Date(input.birthDate) : null,
    sex: input.sex ?? null,
    preferredLanguage: input.preferredLanguage ?? null,
    heightCm: input.heightCm ?? null,
    unitsSystem: input.unitsSystem,
  };
  // upsert guards against a missing profile row (should exist from registration).
  return prisma.patientProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export async function completeOnboarding(userId: string) {
  return prisma.patientProfile.update({
    where: { userId },
    data: { onboardedAt: new Date() },
  });
}

export async function isOnboarded(userId: string): Promise<boolean> {
  const p = await prisma.patientProfile.findUnique({
    where: { userId },
    select: { onboardedAt: true },
  });
  return Boolean(p?.onboardedAt);
}

export function getEmergencyContacts(userId: string) {
  return prisma.emergencyContact.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
}

export async function addEmergencyContact(
  userId: string,
  input: EmergencyContactInput,
) {
  if (input.isPrimary) {
    // Only one primary contact per patient.
    await prisma.emergencyContact.updateMany({
      where: { userId, deletedAt: null, isPrimary: true },
      data: { isPrimary: false },
    });
  }
  return prisma.emergencyContact.create({
    data: {
      userId,
      name: input.name,
      relationship: input.relationship ?? null,
      phone: input.phone,
      isPrimary: input.isPrimary,
    },
  });
}

/** Soft-delete, scoped by userId so a patient can only remove their own row. */
export async function removeEmergencyContact(userId: string, id: string) {
  const res = await prisma.emergencyContact.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return res.count > 0;
}

export function getConsents(userId: string) {
  return prisma.consent.findMany({
    where: { userId, deletedAt: null },
    orderBy: { type: 'asc' },
  });
}

export async function setOfflineSummaryConsent(userId: string, granted: boolean) {
  const now = new Date();
  const existing = await prisma.consent.findFirst({
    where: { userId, type: 'OFFLINE_SUMMARY', deletedAt: null },
    select: { id: true },
  });
  await prisma.$transaction([
    prisma.userSettings.update({
      where: { userId },
      data: { offlineSummaryConsent: granted },
    }),
    existing
      ? prisma.consent.update({
          where: { id: existing.id },
          data: {
            granted,
            grantedAt: granted ? now : null,
            revokedAt: granted ? null : now,
          },
        })
      : prisma.consent.create({
          data: {
            userId,
            type: 'OFFLINE_SUMMARY',
            granted,
            version: 'v1',
            grantedAt: granted ? now : null,
            revokedAt: granted ? null : now,
          },
        }),
  ]);
}
