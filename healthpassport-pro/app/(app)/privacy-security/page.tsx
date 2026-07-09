import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Privacy and security' };

export default function PrivacySecurityPage() {
  return (
    <PlaceholderPage
      title="Privacy and security"
      description="Consent, sessions, data export, and erasure."
      phaseNote="Consent management, data export, and data erasure are built in Phase 3 and hardened in Phase 10."
    />
  );
}
