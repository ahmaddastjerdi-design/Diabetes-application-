import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Documents' };

export default function DocumentsPage() {
  return (
    <PlaceholderPage
      title="Documents"
      description="Store medical documents securely."
      phaseNote="Secure document upload is built in Phase 7."
    />
  );
}
