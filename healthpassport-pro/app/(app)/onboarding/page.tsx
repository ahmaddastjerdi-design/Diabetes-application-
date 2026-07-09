import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Onboarding' };

export default function OnboardingPage() {
  return (
    <PlaceholderPage
      title="Welcome — let's set up your record"
      description="Consent, profile basics, and your emergency contact."
      phaseNote="The guided onboarding flow (consent capture, profile, conditions, and emergency contact) is built in Phase 3."
    />
  );
}
