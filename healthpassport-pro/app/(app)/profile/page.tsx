import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Your profile' };

export default function ProfilePage() {
  return (
    <PlaceholderPage
      title="Your profile"
      description="Demographics, preferences, and units."
      phaseNote="Your patient profile is built in Phase 3."
    />
  );
}
