import type { Metadata } from 'next';
import Link from 'next/link';
import type { UnitsSystem } from '@prisma/client';
import { requireUser } from '@/lib/auth/session';
import { getSettings } from '@/lib/data/settings';
import { getProfile } from '@/lib/data/profile';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsForm } from '@/components/settings/settings-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { SettingsInput } from '@/lib/validation/settings';

export const metadata: Metadata = { title: 'Settings' };

const LOCALES: readonly string[] = ['en', 'es', 'fr', 'ar'];
const THEMES: readonly string[] = ['light', 'dark', 'system'];

export default async function SettingsPage() {
  const user = await requireUser();
  const [settings, profile] = await Promise.all([
    getSettings(user.id),
    getProfile(user.id),
  ]);

  const displayName =
    user.name ??
    [profile?.givenName, profile?.familyName].filter(Boolean).join(' ');

  const defaults: SettingsInput = {
    locale: LOCALES.includes(settings.locale)
      ? (settings.locale as SettingsInput['locale'])
      : 'en',
    theme: THEMES.includes(settings.theme)
      ? (settings.theme as SettingsInput['theme'])
      : 'system',
    unitsSystem: settings.unitsSystem as UnitsSystem,
    notificationsEnabled: settings.notificationsEnabled,
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your account, language, units, and notifications."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Update your name and personal details on your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{displayName || '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="pt-2">
              <Link
                href="/profile"
                className="text-sm font-medium text-primary hover:underline"
              >
                Edit profile →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              These apply across the app and your reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm defaultValues={defaults} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
