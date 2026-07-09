import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { Button, Card, EmptyState, PageHeader, Stack } from '../../ui/primitives';
import { useRecords } from '../../state/RecordsProvider';
import { activeCareModules } from '../../domain/valuesets/conditions';
import { AddReadingModal } from '../observations/AddReadingModal';
import type { ObservationKey } from '../../domain/valuesets/observations';
import { DiabetesCard } from './DiabetesCard';
import { HypertensionCard } from './HypertensionCard';

export function CareScreen() {
  const { t } = useI18n();
  const { byType, save } = useRecords();
  const [addKey, setAddKey] = useState<ObservationKey | null>(null);

  const observations = byType('Observation');
  const conditions = byType('Condition');
  const modules = activeCareModules(conditions);

  return (
    <Stack>
      <PageHeader title={t('care.title')} />

      {modules.length === 0 ? (
        <Card>
          <EmptyState>
            <p>{t('care.noModules')}</p>
            <p style={{ marginTop: 'var(--hp-space-3)' }}>
              <Link to="/record">
                <Button variant="secondary">{t('care.goToRecord')}</Button>
              </Link>
            </p>
          </EmptyState>
        </Card>
      ) : (
        <>
          {modules.includes('diabetes') && (
            <DiabetesCard
              observations={observations}
              onAdd={() => setAddKey('glucose')}
            />
          )}
          {modules.includes('hypertension') && (
            <HypertensionCard
              observations={observations}
              onAdd={() => setAddKey('bloodPressure')}
            />
          )}
        </>
      )}

      {addKey && (
        <AddReadingModal
          initialKey={addKey}
          onClose={() => setAddKey(null)}
          onSaved={(o) => save(o)}
        />
      )}
    </Stack>
  );
}
