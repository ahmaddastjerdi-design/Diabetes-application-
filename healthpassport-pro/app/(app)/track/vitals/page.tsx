import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { listVitals } from '@/lib/data/tracking';
import { VITAL_META } from '@/lib/clinical/measurements';
import {
  VITAL_REFERENCE,
  compareToRange,
  evaluateVital,
} from '@/lib/medical-rules';
import { formatDateTime, shortDate } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, type HealthStatus } from '@/components/health/status-badge';
import { TrendChart, type TrendPoint } from '@/components/charts/trend-chart';
import { AddVitalForm } from '@/components/tracking/add-vital-form';
import { DeleteTrackingButton } from '@/components/tracking/delete-tracking-button';

export const metadata: Metadata = { title: 'Vitals' };

type Vital = Awaited<ReturnType<typeof listVitals>>[number];

function toneFor(v: Vital): { status: HealthStatus; label: string } {
  const evalr = evaluateVital(
    v.type,
    v.valueNumeric ?? 0,
    v.unit,
    v.valueSecondary ?? undefined,
  );
  if (evalr.disposition === 'EMERGENCY') return { status: 'alert', label: 'Seek care' };
  if (evalr.disposition === 'URGENT') return { status: 'alert', label: 'Check with team' };
  const cmp = compareToRange(VITAL_REFERENCE[v.type], v.valueNumeric ?? 0);
  if (cmp === 'in-range') return { status: 'ok', label: 'In range' };
  if (cmp === 'above') return { status: 'caution', label: 'Above range' };
  if (cmp === 'below') return { status: 'caution', label: 'Below range' };
  return { status: 'neutral', label: 'Recorded' };
}

function valueText(v: Vital): string {
  if (v.type === 'BLOOD_PRESSURE')
    return `${v.valueNumeric}/${v.valueSecondary} ${v.unit}`;
  return `${v.valueNumeric} ${v.unit}`;
}

function chartFor(vitals: Vital[], type: Vital['type']): TrendPoint[] {
  return vitals
    .filter((v) => v.type === type)
    .slice()
    .reverse()
    .map((v) => ({
      label: shortDate(v.recordedAt),
      value: v.valueNumeric ?? 0,
      value2: v.valueSecondary ?? undefined,
    }));
}

export default async function VitalsPage() {
  const user = await requireUser();
  const vitals = await listVitals(user.id);

  const glucose = chartFor(vitals, 'GLUCOSE');
  const bp = chartFor(vitals, 'BLOOD_PRESSURE');
  const recent = vitals.slice(0, 20);

  return (
    <>
      <PageHeader title="Vitals" description="Track your readings and see the trend." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add a reading</CardTitle>
          </CardHeader>
          <CardContent>
            <AddVitalForm />
          </CardContent>
        </Card>

        {glucose.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Glucose trend</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart
                points={glucose}
                unit="mg/dL"
                seriesLabel="Glucose"
                band={{ low: VITAL_REFERENCE.GLUCOSE?.low, high: VITAL_REFERENCE.GLUCOSE?.high }}
                summary={`Glucose over your last ${glucose.length} readings.`}
              />
            </CardContent>
          </Card>
        )}

        {bp.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Blood pressure trend</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart
                points={bp}
                unit="mmHg"
                seriesLabel="Systolic"
                series2Label="Diastolic"
                summary={`Blood pressure over your last ${bp.length} readings.`}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent readings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">
                No readings yet. Add your first above.
              </p>
            ) : (
              <ul className="divide-y">
                {recent.map((v) => {
                  const tone = toneFor(v);
                  return (
                    <li key={v.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {VITAL_META[v.type].label}: {valueText(v)}
                          </span>
                          <StatusBadge status={tone.status}>{tone.label}</StatusBadge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(v.recordedAt)}
                        </p>
                      </div>
                      <DeleteTrackingButton model="vital" id={v.id} label={VITAL_META[v.type].label} />
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
