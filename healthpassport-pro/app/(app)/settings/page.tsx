import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Account, language, units, and notifications."
      phaseNote="Settings are built alongside later phases."
    />
  );
}
