import { prisma } from '@/lib/db/prisma';

export function listDocuments(userId: string) {
  return prisma.document.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

export function getDocument(userId: string, id: string) {
  // Scoped by userId — a patient can only ever fetch their own document.
  return prisma.document.findFirst({ where: { id, userId, deletedAt: null } });
}

export function createDocument(
  userId: string,
  data: {
    title: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    checksumSha256: string;
    category?: string;
  },
) {
  return prisma.document.create({
    data: {
      userId,
      title: data.title,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      storageKey: data.storageKey,
      checksumSha256: data.checksumSha256,
      category: data.category ?? null,
    },
  });
}

/** Soft-delete scoped by owner; returns the storageKey so the blob can be purged. */
export async function softDeleteDocument(
  userId: string,
  id: string,
): Promise<string | null> {
  const doc = await prisma.document.findFirst({
    where: { id, userId, deletedAt: null },
    select: { storageKey: true },
  });
  if (!doc) return null;
  await prisma.document.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return doc.storageKey;
}
