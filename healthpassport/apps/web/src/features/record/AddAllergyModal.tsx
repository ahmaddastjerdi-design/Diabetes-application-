import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/primitives';
import { Field, Select, TextInput } from '../../ui/form';
import { makeAllergy } from '../../domain/factories';
import type { AllergyIntolerance } from '../../domain/resources';

export function AddAllergyModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (a: AllergyIntolerance) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [criticality, setCriticality] =
    useState<AllergyIntolerance['criticality']>('unable-to-assess');
  const [reaction, setReaction] = useState('');

  async function onSubmit() {
    if (!name.trim()) return;
    await onSaved(makeAllergy(name.trim(), criticality, reaction.trim() || undefined));
    onClose();
  }

  return (
    <Modal title={t('record.addAllergy')} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
      >
        <div className="hp-stack">
          <Field label={t('forms.allergy')} required>
            {({ id }) => (
              <TextInput
                id={id}
                value={name}
                autoFocus
                placeholder="e.g. Penicillin"
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('forms.criticality')}>
            {({ id }) => (
              <Select
                id={id}
                value={criticality}
                onChange={(e) =>
                  setCriticality(e.target.value as AllergyIntolerance['criticality'])
                }
              >
                <option value="high">{t('forms.severityHigh')}</option>
                <option value="low">{t('forms.severityLow')}</option>
                <option value="unable-to-assess">{t('profile.unknown')}</option>
              </Select>
            )}
          </Field>
          <Field label={t('forms.reaction')}>
            {({ id }) => (
              <TextInput
                id={id}
                value={reaction}
                placeholder="e.g. rash, swelling"
                onChange={(e) => setReaction(e.target.value)}
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
