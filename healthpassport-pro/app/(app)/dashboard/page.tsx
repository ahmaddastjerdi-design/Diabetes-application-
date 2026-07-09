import Link from 'next/link';
import type { Metadata } from 'next';
import { Activity, ClipboardList, FileText, FlaskConical } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { MedicalDisclaimer } from '@/components/safety/medical-disclaimer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Dashboard' };

const QUICK_LINKS = [
  { href: '/track/vitals', label: 'Log a vital', icon: Activity },
  { href: '/track/labs', label: 'Add a lab result', icon: FlaskConical },
  { href: '/records/conditions', label: 'Your conditions', icon: ClipboardList },
  { href: '/reports', label: 'Doctor report', icon: FileText },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Welcome back"
        description="Here's your health at a glance."
      />

      <MedicalDisclaimer className="mb-6" />

      <section aria-labelledby="quick-actions" className="mb-6">
        <h2 id="quick-actions" className="sr-only">
          Quick actions
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {QUICK_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="block focus-visible:outline-none">
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="flex items-center gap-3 py-4">
                    <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
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

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s overview</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Your trends and recent readings will appear here once you start logging.
          Tracking begins in the next phases.
        </CardContent>
      </Card>
    </>
  );
}
