import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Allergies' };

export default function AllergiesPage() {
  return (
    <PlaceholderPage
      title="Allergies"
      description="Allergies and intolerances."
      phaseNote="Allergies are built in Phase 4."
    />
  );
}
