import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button, Card, PageHeader, Stack } from '../../ui/primitives';
import { formatDate } from '../../ui/format';
import { useRecords } from '../../state/RecordsProvider';
import { useSession } from '../../state/SessionProvider';
import { ListSection } from './ListSection';
import { AddConditionModal } from './AddConditionModal';
import { AddMedicationModal } from './AddMedicationModal';
import { AddAllergyModal } from './AddAllergyModal';
import { EditProfileModal } from './EditProfileModal';
import './record.css';

type ModalKind = 'condition' | 'medication' | 'allergy' | 'profile' | null;

export function RecordScreen() {
  const { t, locale } = useI18n();
  const { patient, byType, save, remove } = useRecords();
  const { lock, eraseEverything } = useSession();
  const [modal, setModal] = useState<ModalKind>(null);

  const conditions = byType('Condition');
  const medications = byType('MedicationStatement');
  const allergies = byType('AllergyIntolerance');

  const fullName =
    [patient?.givenName, patient?.familyName].filter(Boolean).join(' ') || '';

  return (
    <Stack>
      <PageHeader title={t('record.title')} />

      <Card>
        <div className="hp-section-head">
          <h2 className="hp-section-head__title">{t('record.profile')}</h2>
          <Button variant="ghost" onClick={() => setModal('profile')}>
            {t('common.edit')}
          </Button>
        </div>
        {patient && (fullName || patient.birthDate || patient.gender) ? (
          <div className="hp-list__meta" style={{ color: 'var(--hp-text)' }}>
            {fullName && <div className="hp-list__title">{fullName}</div>}
            {patient.birthDate && (
              <div>
                {t('profile.birthDate')}: {formatDate(patient.birthDate, locale)}
              </div>
            )}
            {patient.gender && patient.gender !== 'unknown' && (
              <div>
                {t('profile.gender')}: {t(`profile.${patient.gender}`)}
              </div>
            )}
          </div>
        ) : (
          <p className="hp-card__subtitle">{t('profile.empty')}</p>
        )}
      </Card>

      <ListSection
        title={t('record.conditions')}
        addLabel={t('common.add')}
        onAdd={() => setModal('condition')}
        onRemove={(id) => void remove('Condition', id)}
        items={conditions.map((c) => ({
          id: c.id,
          title: c.code.text,
          meta: c.onsetDate ? formatDate(c.onsetDate, locale) : undefined,
        }))}
      />

      <ListSection
        title={t('record.medications')}
        addLabel={t('common.add')}
        onAdd={() => setModal('medication')}
        onRemove={(id) => void remove('MedicationStatement', id)}
        items={medications.map((m) => ({
          id: m.id,
          title: m.medication.text,
          meta: m.dosageText,
        }))}
      />

      <ListSection
        title={t('record.allergies')}
        addLabel={t('common.add')}
        onAdd={() => setModal('allergy')}
        onRemove={(id) => void remove('AllergyIntolerance', id)}
        items={allergies.map((a) => ({
          id: a.id,
          title: a.code.text,
          meta: a.reaction,
        }))}
      />

      <Card>
        <div className="hp-row hp-row-between hp-wrap">
          <Button variant="secondary" onClick={lock}>
            🔒 {t('record.lock')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm(t('record.dangerConfirm'))) void eraseEverything();
            }}
          >
            {t('record.danger')}
          </Button>
        </div>
      </Card>

      {modal === 'profile' && (
        <EditProfileModal
          current={patient}
          onClose={() => setModal(null)}
          onSaved={(p) => save(p)}
        />
      )}
      {modal === 'condition' && (
        <AddConditionModal onClose={() => setModal(null)} onSaved={(c) => save(c)} />
      )}
      {modal === 'medication' && (
        <AddMedicationModal onClose={() => setModal(null)} onSaved={(m) => save(m)} />
      )}
      {modal === 'allergy' && (
        <AddAllergyModal onClose={() => setModal(null)} onSaved={(a) => save(a)} />
      )}
    </Stack>
  );
}
