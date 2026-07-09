import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button, Card, EmptyState, Notice, PageHeader, Stack } from '../../ui/primitives';
import { formatDateTime } from '../../ui/format';
import { useRecords } from '../../state/RecordsProvider';
import { AddReadingModal } from '../observations/AddReadingModal';
import { observationLabel, observationValue } from '../observations/format';
import '../record/record.css';

export function HomeScreen() {
  const { t, locale } = useI18n();
  const { patient, byType, save } = useRecords();
  const [adding, setAdding] = useState(false);

  const greeting = patient?.givenName
    ? t('home.greetingNamed', { name: patient.givenName })
    : t('home.greeting');

  const readings = byType('Observation')
    .slice()
    .sort((a, b) => b.effectiveDateTime.localeCompare(a.effectiveDateTime));
  const recent = readings.slice(0, 6);

  return (
    <Stack>
      <PageHeader title={greeting} subtitle={t('home.todayOverview')} />

      <Notice tone="info" icon="ℹ️" role="note">
        {t('disclaimer.banner')}
      </Notice>

      <Button block onClick={() => setAdding(true)}>
        ＋ {t('record.addReading')}
      </Button>

      <Card>
        <div className="hp-section-head">
          <h2 className="hp-section-head__title">{t('home.recentReadings')}</h2>
        </div>
        {recent.length === 0 ? (
          <EmptyState>{t('home.noReadings')}</EmptyState>
        ) : (
          <div className="hp-list">
            {recent.map((o) => (
              <div className="hp-list__item" key={o.id}>
                <div className="hp-list__main">
                  <div className="hp-list__title">{observationLabel(o)}</div>
                  <div className="hp-list__meta">
                    {formatDateTime(o.effectiveDateTime, locale)}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 'var(--hp-fs-lg)' }}>
                  {observationValue(o)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {adding && (
        <AddReadingModal onClose={() => setAdding(false)} onSaved={(o) => save(o)} />
      )}
    </Stack>
  );
}
