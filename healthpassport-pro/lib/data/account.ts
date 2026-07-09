import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

/**
 * Change the user's password after verifying the current one. Returns false if
 * the current password is wrong (no user enumeration, no detail leaked).
 */
export async function changePassword(
  userId: string,
  current: string,
  next: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) return false;
  const ok = await verifyPassword(current, user.passwordHash);
  if (!ok) return false;
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(next) },
  });
  return true;
}

/**
 * Permanently erase the account and all owned records. Every clinical relation
 * is `onDelete: Cascade`, so this removes the user's PHI in full — the privacy
 * model's right-to-erasure (docs/PRIVACY_MODEL.md).
 */
export async function deleteAccount(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } });
}
