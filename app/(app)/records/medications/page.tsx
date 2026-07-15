import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { listMedications } from '@/lib/data/records';
import { formatDate, humanizeEnum } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout/page-header';
import { RecordSection, type RecordRow } from '@/components/records/record-section';
import { AddMedicationForm } from '@/components/records/add-medication-form';
import type { HealthStatus } from '@/components/health/status-badge';

export const metadata: Metadata = { title: 'Medications' };

const STATUS_TONE: Record<string, HealthStatus> = {
  ACTIVE: 'ok',
  STOPPED: 'neutral',
  COMPLETED: 'neutral',
};

export default async function MedicationsPage() {
  const user = await requireUser();
  const meds = await listMedications(user.id);
  const items: RecordRow[] = meds.map((m) => ({
    id: m.id,
    title: m.name,
    meta: [m.dosageText ?? '', m.startDate ? `since ${formatDate(m.startDate)}` : '']
      .filter(Boolean)
      .join(' · '),
    badge: { status: STATUS_TONE[m.status] ?? 'neutral', label: humanizeEnum(m.status) },
  }));

  return (
    <>
      <PageHeader title="Medications" description="Medicines you take." />
      <RecordSection
        items={items}
        model="medication"
        addTitle="Add a medication"
        addForm={<AddMedicationForm />}
        emptyText="No medications recorded yet."
      />
    </>
  );
}
