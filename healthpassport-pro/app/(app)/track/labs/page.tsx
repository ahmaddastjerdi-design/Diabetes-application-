import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Labs' };

export default function LabsPage() {
  return (
    <PlaceholderPage
      title="Labs"
      description="HbA1c, lipids, kidney function, and more."
      phaseNote="Lab tracking with trends is built in Phase 5."
    />
  );
}
