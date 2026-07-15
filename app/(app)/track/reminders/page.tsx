import type { Metadata } from 'next';
import { Bell, CalendarClock, Pill, ShieldCheck, Activity, Sparkles } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import {
  listReminders,
  getAdherence,
  getPreventiveSuggestions,
} from '@/lib/data/reminders';
import { listMedications } from '@/lib/data/records';
import { PageHeader } from '@/components/layout/page-header';
import { MedicalDisclaimer } from '@/components/safety/medical-disclaimer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/health/status-badge';
import { AddReminderForm } from '@/components/reminders/add-reminder-form';
import { ReminderControls } from '@/components/reminders/reminder-controls';
import { AcceptSuggestionButton } from '@/components/reminders/accept-suggestion-button';
import type { ReminderType } from '@prisma/client';

export const metadata: Metadata = { title: 'Reminders' };

const TYPE_ICON: Record<ReminderType, typeof Bell> = {
  MEDICATION: Pill,
  MEASUREMENT: Activity,
  APPOINTMENT: CalendarClock,
  PREVENTIVE: ShieldCheck,
};
const TYPE_LABEL: Record<ReminderType, string> = {
  MEDICATION: 'Medication',
  MEASUREMENT: 'Measurement',
  APPOINTMENT: 'Appointment',
  PREVENTIVE: 'Preventive',
};

export default async function RemindersPage() {
  const user = await requireUser();
  const [reminders, meds, adherence, suggestions] = await Promise.all([
    listReminders(user.id),
    listMedications(user.id),
    getAdherence(user.id),
    getPreventiveSuggestions(user.id),
  ]);

  const medNames = meds
    .filter((m) => m.status === 'ACTIVE')
    .map((m) => m.name);

  const adhStatus =
    adherence.loggedDays === 0
      ? 'neutral'
      : adherence.rate >= 80
        ? 'ok'
        : adherence.rate >= 50
          ? 'caution'
          : 'alert';

  return (
    <>
      <PageHeader
        title="Reminders"
        description="Set medication and care reminders, and track how consistently you've been taking your medications."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Medication adherence</CardTitle>
          </CardHeader>
          <CardContent>
            {adherence.loggedDays === 0 ? (
              <p className="text-sm text-muted-foreground">
                Log a{' '}
                <a href="/track/daily-checkin" className="text-primary hover:underline">
                  daily check-in
                </a>{' '}
                (with “I took my medications today”) to start tracking adherence.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <div>
                  <div className="text-3xl font-bold tabular-nums">{adherence.rate}%</div>
                  <div className="text-xs text-muted-foreground">
                    {adherence.takenDays} of {adherence.loggedDays} logged days
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold tabular-nums">{adherence.streak}</div>
                  <div className="text-xs text-muted-foreground">day streak</div>
                </div>
                <StatusBadge status={adhStatus}>
                  {adhStatus === 'ok'
                    ? 'On track'
                    : adhStatus === 'caution'
                      ? 'Room to improve'
                      : 'Needs attention'}
                </StatusBadge>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Based on your self-reported check-ins — not a clinical measure. Never
              start, stop, or change a medication without your clinician.
            </p>
          </CardContent>
        </Card>

        {suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles aria-hidden className="size-4 text-primary" />
                Suggested for you
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MedicalDisclaimer variant="compact" />
              <ul className="divide-y">
                {suggestions.map((s) => (
                  <li key={s.key} className="flex items-start justify-between gap-4 py-3 first:pt-0">
                    <div className="min-w-0">
                      <div className="font-medium">{s.title}</div>
                      <div className="text-sm text-muted-foreground">{s.detail}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {s.cadence} · {s.citation}
                      </div>
                    </div>
                    <AcceptSuggestionButton suggestionKey={s.key} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add a reminder</CardTitle>
            </CardHeader>
            <CardContent>
              <AddReminderForm medications={medNames} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your reminders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {reminders.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No reminders yet. Add your first on the left.
                </p>
              ) : (
                <ul className="divide-y">
                  {reminders.map((r) => {
                    const Icon = TYPE_ICON[r.type];
                    return (
                      <li key={r.id} className="flex items-start gap-3 p-4">
                        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-foreground">
                          <Icon aria-hidden className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{r.label}</span>
                            {!r.active && (
                              <StatusBadge status="neutral">Paused</StatusBadge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {TYPE_LABEL[r.type]} · {r.schedule}
                          </div>
                          {r.notes && (
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {r.notes.replace(/\[auto:[\w-]+\]\s*/, '')}
                            </div>
                          )}
                        </div>
                        <ReminderControls id={r.id} active={r.active} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
