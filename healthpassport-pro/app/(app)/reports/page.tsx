import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Doctor report' };

export default function ReportsPage() {
  return (
    <PlaceholderPage
      title="Doctor report"
      description="A summary to share with your care team."
      phaseNote="The physician-ready report (print, export, copy) is built in Phase 8."
    />
  );
}
