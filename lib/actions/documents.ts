'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit/audit';
import { softDeleteDocument } from '@/lib/data/documents';
import { getStorage } from '@/lib/storage';

export async function deleteDocumentAction(
  id: string,
): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const storageKey = await softDeleteDocument(user.id, id);
  if (!storageKey) return { error: 'Not found.' };
  // Purge the blob (best-effort; the metadata row is already soft-deleted).
  await getStorage().delete(storageKey).catch(() => {});
  await recordAudit({ userId: user.id, action: 'DELETE', entityType: 'Document', entityId: id });
  revalidatePath('/records/documents');
  return { ok: true };
}
