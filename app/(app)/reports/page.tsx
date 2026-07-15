import type { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { buildDoctorReport } from '@/lib/report/build';
import { summaryToText } from '@/lib/report/text';
import { PageHeader } from '@/components/layout/page-header';
import { ReportActions } from '@/components/report/report-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Doctor report' };

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="border-b pb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="py-1 text-sm text-muted-foreground">None recorded</p>
      ) : (
        <ul className="list-disc py-1 pl-5 text-sm">
          {items.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function ReportsPage() {
  const user = await requireUser();
  const { summary } = await buildDoctorReport(user.id, new Date().toISOString());
  const text = summaryToText(summary);

  return (
    <>
      <PageHeader
        title="Doctor report"
        description="A summary to share and discuss with your care team."
      />

      <div className="mb-6">
        <ReportActions summaryText={text} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient-generated summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            Generated {summary.generatedAt.slice(0, 10)} with HealthPassport Pro.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {summary.patient.name || summary.patient.birthDate ? (
            <p className="text-sm">
              {summary.patient.name}
              {summary.patient.birthDate ? ` · DOB ${summary.patient.birthDate}` : ''}
              {summary.patient.sex ? ` · ${summary.patient.sex}` : ''}
            </p>
          ) : null}

          {summary.flags.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <p className="flex items-center gap-2 font-semibold text-destructive">
                <AlertTriangle aria-hidden className="size-4" /> Attention
              </p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {summary.flags.map((f, i) => (
                  <li key={i}>
                    [{f.disposition}] {f.detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Section title="Conditions" items={summary.conditions.map((c) => `${c.display} (${c.status.toLowerCase()}${c.onset ? `, since ${c.onset}` : ''})`)} />
          <Section title="Medications" items={summary.medications.map((m) => `${m.name}${m.dosage ? ` — ${m.dosage}` : ''}`)} />
          <Section title="Allergies" items={summary.allergies.map((a) => `${a.substance}${a.reaction ? ` — ${a.reaction}` : ''}`)} />
          <Section title="Latest vitals" items={summary.latestVitals.map((v) => `${v.label}: ${v.value} (${v.recordedAt})`)} />
          <Section title="Latest labs" items={summary.latestLabs.map((l) => `${l.label}: ${l.value} (${l.recordedAt})`)} />

          <p className="border-t pt-3 text-xs text-muted-foreground">
            This patient-generated summary is for discussion with a clinician. It is
            not a diagnosis and may be incomplete.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
