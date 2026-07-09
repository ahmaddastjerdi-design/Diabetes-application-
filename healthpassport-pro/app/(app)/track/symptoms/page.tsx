import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Symptoms' };

export default function SymptomsPage() {
  return (
    <PlaceholderPage
      title="Symptoms"
      description="Log symptoms with red-flag screening."
      phaseNote="Symptom tracking is built in Phase 5, with red-flag screening in Phase 6."
    />
  );
}
