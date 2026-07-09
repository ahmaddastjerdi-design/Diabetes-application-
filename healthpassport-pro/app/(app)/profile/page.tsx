import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { getEmergencyContacts, getProfile } from '@/lib/data/profile';
import { PageHeader } from '@/components/layout/page-header';
import { ProfileForm } from '@/components/forms/profile-form';
import { EmergencyContacts } from '@/components/profile/emergency-contacts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProfileInput } from '@/lib/validation/profile';

export const metadata: Metadata = { title: 'Your profile' };

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, contacts] = await Promise.all([
    getProfile(user.id),
    getEmergencyContacts(user.id),
  ]);

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
      <PageHeader title="Your profile" description="Your details and emergency contacts." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm defaultValues={defaults} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <EmergencyContacts
              initial={contacts.map((c) => ({
                id: c.id,
                name: c.name,
                relationship: c.relationship,
                phone: c.phone,
                isPrimary: c.isPrimary,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
