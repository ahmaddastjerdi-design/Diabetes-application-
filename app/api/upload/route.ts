import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { auth } from '@/auth';
import { getStorage } from '@/lib/storage';
import { createDocument } from '@/lib/data/documents';
import { recordAudit } from '@/lib/audit/audit';
import { rateLimit } from '@/lib/security/rate-limit';
import {
  MAX_UPLOAD_BYTES,
  validateUpload,
} from '@/lib/upload/validate';

export const runtime = 'nodejs';

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  // Rate limit uploads per user (defense in depth).
  const limit = rateLimit(`upload:${userId}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many uploads. Try again shortly.' }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'File is too large (max 10 MB).' }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateUpload(file.name, file.size, bytes);
  if (!validation.ok || !validation.type) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const title = (form.get('title') as string | null)?.trim() || file.name;
  const category = (form.get('category') as string | null)?.trim() || undefined;

  const checksum = await sha256Hex(bytes);
  const storageKey = `${randomBytes(16).toString('hex')}.${validation.type.ext}`;

  await getStorage().put(storageKey, bytes, validation.type.mime);

  try {
    const doc = await createDocument(userId, {
      title: title.slice(0, 200),
      mimeType: validation.type.mime,
      sizeBytes: file.size,
      storageKey,
      checksumSha256: checksum,
      category,
    });
    await recordAudit({ userId, action: 'CREATE', entityType: 'Document', entityId: doc.id });
    return NextResponse.json({ ok: true, id: doc.id });
  } catch {
    // Roll back the stored blob if the metadata write failed.
    await getStorage().delete(storageKey).catch(() => {});
    return NextResponse.json({ error: 'Could not save the document.' }, { status: 500 });
  }
}
