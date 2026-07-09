import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Daily check-in' };

export default function DailyCheckinPage() {
  return (
    <PlaceholderPage
      title="Daily check-in"
      description="A quick daily log."
      phaseNote="The daily check-in is built in Phase 5."
    />
  );
}
