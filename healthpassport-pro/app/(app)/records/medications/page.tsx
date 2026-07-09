import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Medications' };

export default function MedicationsPage() {
  return (
    <PlaceholderPage
      title="Medications"
      description="Medicines you take."
      phaseNote="Medications are built in Phase 4."
    />
  );
}
