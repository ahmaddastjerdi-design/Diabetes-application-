import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { listCheckIns } from '@/lib/data/tracking';
import { formatDate } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckInForm } from '@/components/tracking/check-in-form';

export const metadata: Metadata = { title: 'Daily check-in' };

const MOOD = ['', 'Very low', 'Low', 'Okay', 'Good', 'Great'];

export default async function DailyCheckinPage() {
  const user = await requireUser();
  const checkIns = await listCheckIns(user.id);
  const today = new Date().toISOString().slice(0, 10);
  const todays = checkIns.find(
    (c) => c.date.toISOString().slice(0, 10) === today,
  );

  return (
    <>
      <PageHeader title="Daily check-in" description="A quick daily note to yourself." />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Today</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckInForm
              defaults={{
                date: today,
                mood: todays?.mood ?? undefined,
                medicationTaken: todays?.medicationTaken ?? undefined,
                note: todays?.note ?? '',
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent check-ins</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {checkIns.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">No check-ins yet.</p>
            ) : (
              <ul className="divide-y">
                {checkIns.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{formatDate(c.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.mood != null ? `Feeling: ${MOOD[c.mood]}` : ''}
                        {c.medicationTaken != null
                          ? `${c.mood != null ? ' · ' : ''}Meds: ${c.medicationTaken ? 'taken' : 'not taken'}`
                          : ''}
                        {c.note ? ` · ${c.note}` : ''}
                      </p>
                    </div>
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
