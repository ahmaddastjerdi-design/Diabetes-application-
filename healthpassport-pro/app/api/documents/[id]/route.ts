import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDocument } from '@/lib/data/documents';
import { getStorage } from '@/lib/storage';
import { recordAudit } from '@/lib/audit/audit';

export const runtime = 'nodejs';

/** Auth + ownership-gated document download (the "signed URL" for local storage). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  // Ownership check: getDocument is scoped by the session user id.
  const doc = await getDocument(session.user.id, id);
  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let bytes: Uint8Array;
  try {
    bytes = await getStorage().get(doc.storageKey);
  } catch {
    return NextResponse.json({ error: 'File unavailable' }, { status: 404 });
  }

  await recordAudit({
    userId: session.user.id,
    action: 'EXPORT',
    entityType: 'Document',
    entityId: doc.id,
  });

  return new NextResponse(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': doc.mimeType,
      // Inline for images/PDF viewing; the filename is the record title.
      'Content-Disposition': `inline; filename="${encodeURIComponent(doc.title)}"`,
      'Content-Length': String(doc.sizeBytes),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
