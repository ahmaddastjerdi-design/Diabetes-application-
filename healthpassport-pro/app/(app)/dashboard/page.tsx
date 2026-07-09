import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  Activity,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  FlaskConical,
  Pill,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { MedicalDisclaimer } from '@/components/safety/medical-disclaimer';
import { SafetyAlert } from '@/components/safety/safety-alert';
import { StatusBadge } from '@/components/health/status-badge';
import { TrendChart, type TrendPoint } from '@/components/charts/trend-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireUser } from '@/lib/auth/session';
import { isOnboarded } from '@/lib/data/profile';
import { listVitals, listLabs, listCheckIns } from '@/lib/data/tracking';
import { listConditions, listMedications } from '@/lib/data/records';
import { getAdherence } from '@/lib/data/reminders';
import { VITAL_META, LAB_META } from '@/lib/clinical/measurements';
import {
  VITAL_REFERENCE,
  evaluateVital,
  evaluateLab,
  evaluationOf,
  type Finding,
} from '@/lib/medical-rules';
import { latestVitalViews, type VitalLike } from '@/lib/dashboard/metrics';
import { shortDate } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Dashboard' };

const QUICK_LINKS = [
  { href: '/track/vitals', label: 'Log a vital', icon: Activity },
  { href: '/track/labs', label: 'Add a lab result', icon: FlaskConical },
  { href: '/track/daily-checkin', label: 'Daily check-in', icon: CalendarCheck },
  { href: '/reports', label: 'Doctor report', icon: FileText },
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export default async function DashboardPage() {
  // Server-side auth boundary (defense in depth alongside middleware).
  const user = await requireUser();
  // First-run patients complete onboarding before seeing the dashboard.
  if (!(await isOnboarded(user.id))) redirect('/onboarding');

  const [vitals, labs, conditions, medications, checkIns, adherence] =
    await Promise.all([
      listVitals(user.id),
      listLabs(user.id),
      listConditions(user.id),
      listMedications(user.id),
      listCheckIns(user.id, 7),
      getAdherence(user.id),
    ]);

  // Latest reading per vital type → metric cards.
  const metricCards = latestVitalViews(vitals as VitalLike[]);

  // Aggregate acute red flags from the latest reading of each vital and lab.
  const seenVital = new Set<string>();
  const seenLab = new Set<string>();
  const flags: Finding[] = [];
  for (const v of vitals) {
    if (seenVital.has(v.type)) continue;
    seenVital.add(v.type);
    flags.push(
      ...evaluateVital(v.type, v.valueNumeric ?? 0, v.unit, v.valueSecondary ?? undefined)
        .findings,
    );
  }
  for (const l of labs) {
    if (seenLab.has(l.type)) continue;
    seenLab.add(l.type);
    flags.push(...evaluateLab(l.type, l.value).findings);
  }
  const attention = evaluationOf(flags);

  // Trend: prefer blood pressure, else glucose.
  const chartFor = (type: VitalLike['type']): TrendPoint[] =>
    (vitals as VitalLike[])
      .filter((v) => v.type === type)
      .slice()
      .reverse()
      .map((v) => ({
        label: shortDate(v.recordedAt),
        value: v.valueNumeric ?? 0,
        value2: v.valueSecondary ?? undefined,
      }));
  const bp = chartFor('BLOOD_PRESSURE');
  const glucose = chartFor('GLUCOSE');
  const trend =
    bp.length > 1
      ? { points: bp, unit: 'mmHg', seriesLabel: 'Systolic', series2Label: 'Diastolic', title: 'Blood pressure trend', band: undefined }
      : glucose.length > 1
        ? {
            points: glucose,
            unit: 'mg/dL',
            seriesLabel: 'Glucose',
            series2Label: undefined,
            title: 'Glucose trend',
            band: { low: VITAL_REFERENCE.GLUCOSE?.low, high: VITAL_REFERENCE.GLUCOSE?.high },
          }
        : null;

  // Recent activity (most recent events across records).
  const activity = [
    ...vitals.slice(0, 3).map((v) => ({
      icon: Activity,
      label: `Logged ${VITAL_META[v.type].label.toLowerCase()}`,
      at: v.recordedAt,
    })),
    ...labs.slice(0, 2).map((l) => ({
      icon: FlaskConical,
      label: `Added lab: ${LAB_META[l.type].label}`,
      at: l.recordedAt,
    })),
    ...checkIns.slice(0, 1).map((c) => ({
      icon: CalendarCheck,
      label: 'Saved a daily check-in',
      at: c.date,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 5);

  // Gentle activity nudges (not medical advice) derived from real state.
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 864e5);
  const reminders: { label: string; tone: 'caution' | 'neutral' }[] = [];
  if (flags.length > 0)
    reminders.push({
      label: 'Review your flagged readings with your care team',
      tone: 'caution',
    });
  if (!checkIns[0] || !isSameDay(checkIns[0].date, today))
    reminders.push({ label: "Log today's daily check-in", tone: 'neutral' });
  if (vitals.filter((v) => v.recordedAt >= weekAgo).length < 2)
    reminders.push({
      label: 'Log a vital to keep your trend current',
      tone: 'neutral',
    });

  const activeConditions = conditions.filter((c) => c.clinicalStatus === 'ACTIVE');
  const activeMeds = medications.filter((m) => m.status === 'ACTIVE');

  return (
    <>
      <PageHeader
        title={`Welcome back${user.name ? `, ${user.name}` : ''}`}
        description="Here's your health at a glance."
      />

      <MedicalDisclaimer className="mb-6" />

      {attention.disposition !== 'ROUTINE' && (
        <div className="mb-6">
          <SafetyAlert evaluation={attention} />
        </div>
      )}

      {/* Metric cards */}
      {metricCards.length > 0 && (
        <section aria-labelledby="your-numbers" className="mb-6">
          <h2 id="your-numbers" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your latest numbers
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metricCards.map((m) => (
              <li key={m.type}>
                <Card>
                  <CardContent className="py-4">
                    <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
                    <p className="my-1 text-2xl font-bold tabular-nums">
                      {m.value} <span className="text-sm font-medium text-muted-foreground">{m.unit}</span>
                    </p>
                    <StatusBadge status={m.status}>{m.text}</StatusBadge>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quick actions */}
      <section aria-labelledby="quick-actions" className="mb-6">
        <h2 id="quick-actions" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick actions
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="block focus-visible:outline-none">
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="flex items-center gap-3 py-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <link.icon aria-hidden className="size-5" />
                    </span>
                    <span className="font-medium">{link.label}</span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {trend && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{trend.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart
              points={trend.points}
              unit={trend.unit}
              seriesLabel={trend.seriesLabel}
              series2Label={trend.series2Label}
              band={trend.band}
              summary={`Your last ${trend.points.length} readings.`}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your conditions &amp; medications</CardTitle>
          </CardHeader>
          <CardContent>
            {activeConditions.length === 0 && activeMeds.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active conditions or medications recorded yet.{' '}
                <Link href="/records/conditions" className="text-primary hover:underline">
                  Add them
                </Link>{' '}
                to complete your record.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {activeConditions.map((c) => (
                    <span
                      key={c.id}
                      className="rounded-full border px-3 py-1 text-xs font-medium"
                    >
                      {c.display}
                    </span>
                  ))}
                </div>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Pill aria-hidden className="size-4" />
                  {activeMeds.length} active medication{activeMeds.length === 1 ? '' : 's'} on file
                </p>
                <div className="flex gap-3 text-sm">
                  <Link href="/records/conditions" className="text-primary hover:underline">
                    Conditions
                  </Link>
                  <Link href="/records/medications" className="text-primary hover:underline">
                    Medications
                  </Link>
                  <Link href="/guide" className="flex items-center gap-1 text-primary hover:underline">
                    <BookOpen aria-hidden className="size-3.5" /> Guides
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reminders &amp; activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {adherence.loggedDays > 0 && (
              <Link
                href="/track/reminders"
                className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm hover:border-primary"
              >
                <span className="flex items-center gap-2">
                  <Pill aria-hidden className="size-4 text-muted-foreground" />
                  Medication adherence
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">{adherence.rate}%</span>
                  <StatusBadge status={adherence.rate >= 80 ? 'ok' : adherence.rate >= 50 ? 'caution' : 'alert'}>
                    {adherence.streak}-day streak
                  </StatusBadge>
                </span>
              </Link>
            )}
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ClipboardList aria-hidden className="size-3.5" /> Reminders
              </h3>
              {reminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
              ) : (
                <ul className="space-y-2">
                  {reminders.map((r) => (
                    <li key={r.label} className="flex items-center justify-between gap-3 text-sm">
                      <span>{r.label}</span>
                      <StatusBadge status={r.tone === 'caution' ? 'caution' : 'neutral'}>
                        {r.tone === 'caution' ? 'Follow up' : 'To do'}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Activity aria-hidden className="size-3.5" /> Recent activity
              </h3>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing yet — start by logging a vital.
                </p>
              ) : (
                <ul className="space-y-2">
                  {activity.map((a, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <a.icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1">{a.label}</span>
                      <span className="text-xs text-muted-foreground">{shortDate(a.at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
