import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/primitives';
import { Field, TextInput } from '../../ui/form';
import { makeMedication } from '../../domain/factories';
import type { MedicationStatement } from '../../domain/resources';

export function AddMedicationModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (m: MedicationStatement) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [start, setStart] = useState('');

  async function onSubmit() {
    if (!name.trim()) return;
    await onSaved(
      makeMedication(name.trim(), dosage.trim() || undefined, start || undefined),
    );
    onClose();
  }

  return (
    <Modal title={t('record.addMedication')} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
      >
        <div className="hp-stack">
          <Field label={t('forms.medication')} required>
            {({ id }) => (
              <TextInput
                id={id}
                value={name}
                autoFocus
                placeholder="e.g. Metformin"
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('forms.dosage')}>
            {({ id }) => (
              <TextInput
                id={id}
                value={dosage}
                placeholder="e.g. 500 mg twice daily"
                onChange={(e) => setDosage(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('forms.onsetDate')}>
            {({ id }) => (
              <TextInput
                id={id}
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            )}
          </Field>
          <div className="hp-form-actions">
            <Button variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
