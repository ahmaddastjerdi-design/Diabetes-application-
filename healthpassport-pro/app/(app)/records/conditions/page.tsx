import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { listConditions } from '@/lib/data/records';
import { formatDate, humanizeEnum } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout/page-header';
import { RecordSection, type RecordRow } from '@/components/records/record-section';
import { AddConditionForm } from '@/components/records/add-condition-form';
import type { HealthStatus } from '@/components/health/status-badge';

export const metadata: Metadata = { title: 'Conditions' };

const STATUS_TONE: Record<string, HealthStatus> = {
  ACTIVE: 'caution',
  REMISSION: 'ok',
  RESOLVED: 'ok',
  INACTIVE: 'neutral',
};

export default async function ConditionsPage() {
  const user = await requireUser();
  const conditions = await listConditions(user.id);
  const items: RecordRow[] = conditions.map((c) => ({
    id: c.id,
    title: c.display,
    meta: [c.icd10 ? `ICD-10 ${c.icd10}` : '', c.onsetDate ? `since ${formatDate(c.onsetDate)}` : '']
      .filter(Boolean)
      .join(' · '),
    badge: { status: STATUS_TONE[c.clinicalStatus] ?? 'neutral', label: humanizeEnum(c.clinicalStatus) },
  }));

  return (
    <>
      <PageHeader title="Conditions" description="Your problem list." />
      <RecordSection
        items={items}
        model="condition"
        addTitle="Add a condition"
        addForm={<AddConditionForm />}
        emptyText="No conditions recorded yet."
      />
    </>
  );
}
