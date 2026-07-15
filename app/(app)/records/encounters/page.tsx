import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { listEncounters } from '@/lib/data/records';
import { formatDate, humanizeEnum } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout/page-header';
import { RecordSection } from '@/components/records/record-section';
import { AddEncounterForm } from '@/components/records/add-encounter-form';

export const metadata: Metadata = { title: 'Encounters' };

export default async function EncountersPage() {
  const user = await requireUser();
  const encounters = await listEncounters(user.id);
  const items = encounters.map((e) => ({
    id: e.id,
    title: `${humanizeEnum(e.type)} — ${formatDate(e.occurredAt)}`,
    meta: [e.provider ?? '', e.reason ?? '', e.summary ?? '']
      .filter(Boolean)
      .join(' · '),
  }));

  return (
    <>
      <PageHeader title="Encounters" description="Your visits and appointments." />
      <RecordSection
        items={items}
        model="encounter"
        addTitle="Add a visit"
        addForm={<AddEncounterForm />}
        emptyText="No visits recorded yet."
      />
    </>
  );
}
