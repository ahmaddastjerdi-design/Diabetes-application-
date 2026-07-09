import type { Metadata } from 'next';
import { CheckCircle2 } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { getConsents } from '@/lib/data/profile';
import { prisma } from '@/lib/db/prisma';
import { PageHeader } from '@/components/layout/page-header';
import { OfflineConsentToggle } from '@/components/privacy/offline-consent-toggle';
import { MedicalDisclaimer } from '@/components/safety/medical-disclaimer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Privacy and security' };

const CONSENT_LABELS: Record<string, string> = {
  TERMS: 'Terms of Use',
  PRIVACY: 'Privacy Policy',
  MEDICAL_DISCLAIMER: 'Medical Disclaimer',
  DATA_PROCESSING: 'Data processing',
  OFFLINE_SUMMARY: 'Offline summary',
};

export default async function PrivacySecurityPage() {
  const user = await requireUser();
  const [consents, settings] = await Promise.all([
    getConsents(user.id),
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <>
      <PageHeader
        title="Privacy and security"
        description="Your consents and how your data is used."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your consents</CardTitle>
            <CardDescription>
              Granular, versioned, and revocable. You own your data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y rounded-md border">
              {consents.map((c) => (
                <li key={c.id} className="flex items-center justify-between p-3">
                  <span>{CONSENT_LABELS[c.type] ?? c.type}</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                    {c.granted && <CheckCircle2 aria-hidden className="size-4" />}
                    {c.granted ? 'Granted' : 'Not granted'} · {c.version}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offline access</CardTitle>
          </CardHeader>
          <CardContent>
            <OfflineConsentToggle initial={settings?.offlineSummaryConsent ?? false} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your data</CardTitle>
            <CardDescription>
              Export and permanent erasure are added in a later phase (Phase 8/10).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MedicalDisclaimer variant="compact" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
