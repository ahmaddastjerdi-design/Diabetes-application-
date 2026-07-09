import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Chronic-care guide' };

export default function GuidePage() {
  return (
    <PlaceholderPage
      title="Chronic-care guide"
      description="Reviewed, evidence-based education."
      phaseNote="The chronic-disease guide and red-flag rules engine are built in Phase 6."
    />
  );
}
