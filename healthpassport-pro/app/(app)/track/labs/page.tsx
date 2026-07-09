import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { listLabs } from '@/lib/data/tracking';
import { LAB_META } from '@/lib/clinical/measurements';
import { LAB_REFERENCE, compareToRange, evaluateLab } from '@/lib/medical-rules';
import { formatDate, shortDate } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, type HealthStatus } from '@/components/health/status-badge';
import { TrendChart, type TrendPoint } from '@/components/charts/trend-chart';
import { AddLabForm } from '@/components/tracking/add-lab-form';
import { DeleteTrackingButton } from '@/components/tracking/delete-tracking-button';

export const metadata: Metadata = { title: 'Labs' };

type Lab = Awaited<ReturnType<typeof listLabs>>[number];

function toneFor(l: Lab): { status: HealthStatus; label: string } {
  const evalr = evaluateLab(l.type, l.value);
  if (evalr.disposition !== 'ROUTINE') return { status: 'alert', label: 'Check with team' };
  const cmp = compareToRange(LAB_REFERENCE[l.type], l.value);
  if (cmp === 'in-range') return { status: 'ok', label: 'In range' };
  if (cmp === 'above') return { status: 'caution', label: 'Above range' };
  if (cmp === 'below') return { status: 'caution', label: 'Below range' };
  return { status: 'neutral', label: 'Recorded' };
}

function chartFor(labs: Lab[], type: Lab['type']): TrendPoint[] {
  return labs
    .filter((l) => l.type === type)
    .slice()
    .reverse()
    .map((l) => ({ label: shortDate(l.recordedAt), value: l.value }));
}

export default async function LabsPage() {
  const user = await requireUser();
  const labs = await listLabs(user.id);
  const hba1c = chartFor(labs, 'HBA1C');
  const recent = labs.slice(0, 20);

  return (
    <>
      <PageHeader title="Labs" description="Record lab results and watch the trend." />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add a result</CardTitle>
          </CardHeader>
          <CardContent>
            <AddLabForm />
          </CardContent>
        </Card>

        {hba1c.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>HbA1c trend</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart
                points={hba1c}
                unit="%"
                seriesLabel="HbA1c"
                band={{ high: LAB_REFERENCE.HBA1C?.high }}
                summary={`HbA1c over your last ${hba1c.length} results.`}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">
                No results yet. Add your first above.
              </p>
            ) : (
              <ul className="divide-y">
                {recent.map((l) => {
                  const tone = toneFor(l);
                  return (
                    <li key={l.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {LAB_META[l.type].label}: {l.value} {l.unit}
                          </span>
                          <StatusBadge status={tone.status}>{tone.label}</StatusBadge>
                        </div>
                        <p className="text-sm text-muted-foreground">{formatDate(l.recordedAt)}</p>
                      </div>
                      <DeleteTrackingButton model="lab" id={l.id} label={LAB_META[l.type].label} />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
