import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { listAllergies } from '@/lib/data/records';
import { humanizeEnum } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout/page-header';
import { RecordSection, type RecordRow } from '@/components/records/record-section';
import { AddAllergyForm } from '@/components/records/add-allergy-form';
import type { HealthStatus } from '@/components/health/status-badge';

export const metadata: Metadata = { title: 'Allergies' };

const CRIT_TONE: Record<string, HealthStatus> = {
  HIGH: 'alert',
  LOW: 'caution',
  UNABLE_TO_ASSESS: 'neutral',
};

export default async function AllergiesPage() {
  const user = await requireUser();
  const allergies = await listAllergies(user.id);
  const items: RecordRow[] = allergies.map((a) => ({
    id: a.id,
    title: a.substance,
    meta: a.reaction ? `Reaction: ${a.reaction}` : undefined,
    badge: {
      status: CRIT_TONE[a.criticality ?? 'UNABLE_TO_ASSESS'] ?? 'neutral',
      label: humanizeEnum(a.criticality ?? 'UNABLE_TO_ASSESS'),
    },
  }));

  return (
    <>
      <PageHeader title="Allergies" description="Allergies and intolerances." />
      <RecordSection
        items={items}
        model="allergy"
        addTitle="Add an allergy"
        addForm={<AddAllergyForm />}
        emptyText="No allergies recorded yet."
      />
    </>
  );
}
