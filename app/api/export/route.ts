import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { buildDoctorReport } from '@/lib/report/build';
import { recordAudit } from '@/lib/audit/audit';

export const runtime = 'nodejs';

/** Patient-initiated export of the full record as a FHIR Bundle or JSON summary. */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const format = new URL(request.url).searchParams.get('format') === 'fhir' ? 'fhir' : 'summary';
  const generatedAt = new Date().toISOString();
  const report = await buildDoctorReport(session.user.id, generatedAt);

  await recordAudit({
    userId: session.user.id,
    action: 'EXPORT',
    entityType: 'DoctorReport',
    metadata: { format },
  });

  const payload = format === 'fhir' ? report.fhir : report.summary;
  const filename = `healthpassport-${format}-${generatedAt.slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
