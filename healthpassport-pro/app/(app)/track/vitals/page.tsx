import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Vitals' };

export default function VitalsPage() {
  return (
    <PlaceholderPage
      title="Vitals"
      description="Blood pressure, glucose, weight, and more."
      phaseNote="Vitals tracking with charts is built in Phase 5."
    />
  );
}
