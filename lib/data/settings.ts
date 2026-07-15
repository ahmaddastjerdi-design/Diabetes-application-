import { prisma } from '@/lib/db/prisma';
import type { SettingsInput } from '@/lib/validation/settings';

/**
 * Read the user's settings, creating a default row on first access. Always
 * scoped to the owning userId (SECURITY §2).
 */
export async function getSettings(userId: string) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

/** Persist preference changes. Ownership is enforced by the unique userId. */
export async function updateSettings(userId: string, input: SettingsInput) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: input,
    create: { userId, ...input },
  });
}
