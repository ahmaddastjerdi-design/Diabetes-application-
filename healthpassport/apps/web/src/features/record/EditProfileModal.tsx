import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/primitives';
import { Field, Select, TextInput } from '../../ui/form';
import { makePatient } from '../../domain/factories';
import type { AdministrativeGender } from '../../domain/primitives';
import type { Patient } from '../../domain/resources';

export function EditProfileModal({
  current,
  onClose,
  onSaved,
}: {
  current?: Patient;
  onClose: () => void;
  onSaved: (p: Patient) => void | Promise<void>;
}) {
  const { t, locale } = useI18n();
  const [given, setGiven] = useState(current?.givenName ?? '');
  const [family, setFamily] = useState(current?.familyName ?? '');
  const [birthDate, setBirthDate] = useState(current?.birthDate ?? '');
  const [gender, setGender] = useState<AdministrativeGender>(
    current?.gender ?? 'unknown',
  );

  async function onSubmit() {
    await onSaved(
      makePatient({
        ...(given.trim() ? { givenName: given.trim() } : {}),
        ...(family.trim() ? { familyName: family.trim() } : {}),
        ...(birthDate ? { birthDate } : {}),
        gender,
        preferredLanguage: locale,
      }),
    );
    onClose();
  }

  return (
    <Modal title={t('profile.edit')} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
      >
        <div className="hp-stack">
          <Field label={t('profile.given')}>
            {({ id }) => (
              <TextInput
                id={id}
                value={given}
                autoComplete="given-name"
                onChange={(e) => setGiven(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('profile.family')}>
            {({ id }) => (
              <TextInput
                id={id}
                value={family}
                autoComplete="family-name"
                onChange={(e) => setFamily(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('profile.birthDate')}>
            {({ id }) => (
              <TextInput
                id={id}
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('profile.gender')}>
            {({ id }) => (
              <Select
                id={id}
                value={gender}
                onChange={(e) => setGender(e.target.value as AdministrativeGender)}
              >
                <option value="male">{t('profile.male')}</option>
                <option value="female">{t('profile.female')}</option>
                <option value="other">{t('profile.other')}</option>
                <option value="unknown">{t('profile.unknown')}</option>
              </Select>
            )}
          </Field>
          <div className="hp-form-actions">
            <Button variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
