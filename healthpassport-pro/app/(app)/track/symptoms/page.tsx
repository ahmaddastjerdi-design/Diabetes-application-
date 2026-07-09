import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { listSymptoms } from '@/lib/data/tracking';
import { formatDateTime } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout/page-header';
import { MedicalDisclaimer } from '@/components/safety/medical-disclaimer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/health/status-badge';
import { AddSymptomForm } from '@/components/tracking/add-symptom-form';
import { DeleteTrackingButton } from '@/components/tracking/delete-tracking-button';

export const metadata: Metadata = { title: 'Symptoms' };

export default async function SymptomsPage() {
  const user = await requireUser();
  const symptoms = await listSymptoms(user.id);

  return (
    <>
      <PageHeader title="Symptoms" description="Log how you feel — with red-flag awareness." />
      <div className="space-y-6">
        <MedicalDisclaimer variant="compact" />
        <Card>
          <CardHeader>
            <CardTitle>Log a symptom</CardTitle>
          </CardHeader>
          <CardContent>
            <AddSymptomForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent symptoms</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {symptoms.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">Nothing logged yet.</p>
            ) : (
              <ul className="divide-y">
                {symptoms.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{s.description}</span>
                        {s.severity != null && (
                          <span className="text-sm text-muted-foreground">
                            severity {s.severity}/10
                          </span>
                        )}
                        {s.redFlagCodes.length > 0 && (
                          <StatusBadge status="alert">
                            {s.redFlagCodes.length} red flag
                            {s.redFlagCodes.length > 1 ? 's' : ''}
                          </StatusBadge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(s.recordedAt)}
                      </p>
                    </div>
                    <DeleteTrackingButton model="symptom" id={s.id} label={s.description} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
