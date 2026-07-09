import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Encounters' };

export default function EncountersPage() {
  return (
    <PlaceholderPage
      title="Encounters"
      description="Your visits and appointments."
      phaseNote="Encounters are built in Phase 4."
    />
  );
}
