import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { getProfile } from '@/lib/data/profile';
import { PageHeader } from '@/components/layout/page-header';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import type { ProfileInput } from '@/lib/validation/profile';

export const metadata: Metadata = { title: 'Welcome' };

export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (profile?.onboardedAt) redirect('/dashboard');

  const defaults: ProfileInput = {
    givenName: profile?.givenName ?? undefined,
    familyName: profile?.familyName ?? undefined,
    birthDate: profile?.birthDate
      ? profile.birthDate.toISOString().slice(0, 10)
      : undefined,
    sex: (profile?.sex as ProfileInput['sex']) ?? undefined,
    preferredLanguage:
      (profile?.preferredLanguage as ProfileInput['preferredLanguage']) ?? undefined,
    heightCm: profile?.heightCm ?? undefined,
    unitsSystem: profile?.unitsSystem ?? 'METRIC',
  };

  return (
    <>
      <PageHeader
        title="Welcome to HealthPassport Pro"
        description="Two quick steps to set up your record."
      />
      <OnboardingWizard defaults={defaults} />
    </>
  );
}
