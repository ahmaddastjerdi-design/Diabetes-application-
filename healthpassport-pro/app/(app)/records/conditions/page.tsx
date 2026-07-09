import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Conditions' };

export default function ConditionsPage() {
  return (
    <PlaceholderPage
      title="Conditions"
      description="Your problem list."
      phaseNote="Conditions (a coded problem list) are built in Phase 4."
    />
  );
}
