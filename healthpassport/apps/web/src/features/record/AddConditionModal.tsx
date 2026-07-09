import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/primitives';
import { Field, Select, TextInput, Textarea } from '../../ui/form';
import { CONDITION_CATALOG } from '../../domain/valuesets/conditions';
import { makeCondition } from '../../domain/factories';
import type { Condition } from '../../domain/resources';

export function AddConditionModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (c: Condition) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const [key, setKey] = useState('');
  const [onset, setOnset] = useState('');
  const [note, setNote] = useState('');

  const entry = CONDITION_CATALOG.find((c) => c.key === key);

  async function onSubmit() {
    if (!entry) return;
    const condition = makeCondition(
      entry.concept,
      onset || undefined,
      note.trim() || undefined,
    );
    await onSaved(condition);
    onClose();
  }

  return (
    <Modal title={t('record.addCondition')} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
      >
        <div className="hp-stack">
          <Field label={t('forms.condition')} required>
            {({ id }) => (
              <Select id={id} value={key} onChange={(e) => setKey(e.target.value)}>
                <option value="">{t('forms.selectPlaceholder')}</option>
                {CONDITION_CATALOG.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.concept.text}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t('forms.onsetDate')}>
            {({ id }) => (
              <TextInput
                id={id}
                type="date"
                value={onset}
                onChange={(e) => setOnset(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('forms.note')}>
            {({ id }) => (
              <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} />
            )}
          </Field>
          <div className="hp-form-actions">
            <Button variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!entry}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
