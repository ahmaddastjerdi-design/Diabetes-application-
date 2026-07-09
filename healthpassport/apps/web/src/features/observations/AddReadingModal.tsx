import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Modal } from '../../ui/Modal';
import { Button, Notice } from '../../ui/primitives';
import { Field, Select, TextInput, Textarea } from '../../ui/form';
import {
  OBSERVATION_LIST,
  OBSERVATIONS,
  type ObservationKey,
  type UnitDef,
} from '../../domain/valuesets/observations';
import { makeBloodPressure, makeObservation } from '../../domain/factories';
import { validateResource } from '../../domain/validation';
import { evaluateObservation } from '../../safety/engine';
import { SafetyAlert } from '../../safety/SafetyAlert';
import type { SafetyEvaluation } from '../../safety/types';
import type { Observation } from '../../domain/resources';

/** Format a Date as a value for <input type="datetime-local"> (local time). */
function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function AddReadingModal({
  onClose,
  onSaved,
  initialKey = 'glucose',
}: {
  onClose: () => void;
  onSaved: (o: Observation) => void | Promise<void>;
  initialKey?: ObservationKey;
}) {
  const { t } = useI18n();
  const [key, setKey] = useState<ObservationKey>(initialKey);
  const def = OBSERVATIONS[key];

  const unitChoices: UnitDef[] = useMemo(
    () => [def.canonicalUnit, ...(def.altUnits ?? [])],
    [def],
  );
  const [unitCode, setUnitCode] = useState(def.canonicalUnit.code);
  const unit = unitChoices.find((u) => u.code === unitCode) ?? def.canonicalUnit;

  const [value, setValue] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [when, setWhen] = useState(() => toLocalInputValue(new Date()));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  // After saving, if the reading triggers a red flag we hold the modal open on
  // an acknowledgment step showing the escalation instead of closing silently.
  const [escalation, setEscalation] = useState<SafetyEvaluation | null>(null);

  function onSelectMeasurement(nextKey: ObservationKey) {
    setKey(nextKey);
    setUnitCode(OBSERVATIONS[nextKey].canonicalUnit.code);
    setValue('');
    setSystolic('');
    setDiastolic('');
    setError(undefined);
  }

  function build(): Observation | null {
    const effective = new Date(when);
    const iso = Number.isNaN(effective.getTime())
      ? new Date().toISOString()
      : effective.toISOString();
    const trimmedNote = note.trim() || undefined;

    if (key === 'bloodPressure') {
      const sys = Number(systolic);
      const dia = Number(diastolic);
      return makeBloodPressure(sys, dia, iso, trimmedNote);
    }
    const num = Number(value);
    return makeObservation(key, num, unit, iso, trimmedNote);
  }

  async function onSubmit() {
    const obs = build();
    if (!obs) return;
    const result = validateResource(obs);
    if (!result.ok) {
      setError(result.issues[0]?.message ?? 'Please check your entry.');
      return;
    }
    // Persist first (never lose the patient's data), then evaluate for red flags.
    await onSaved(obs);
    const evaluation = evaluateObservation(obs);
    if (evaluation.disposition !== 'ROUTINE') {
      setEscalation(evaluation);
      return;
    }
    onClose();
  }

  if (escalation) {
    return (
      <Modal title={t('safety.emergencyTitle')} onClose={onClose}>
        <div className="hp-stack">
          <p className="hp-card__subtitle">{t('safety.saved')}</p>
          <SafetyAlert evaluation={escalation} />
          <p className="hp-field__hint">{t('safety.referenceNote')}</p>
          <div className="hp-form-actions">
            <Button onClick={onClose}>{t('safety.acknowledge')}</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={t('record.addReading')} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
      >
        <div className="hp-stack">
          <Field label={t('forms.measurement')}>
            {({ id }) => (
              <Select
                id={id}
                value={key}
                onChange={(e) => onSelectMeasurement(e.target.value as ObservationKey)}
              >
                {OBSERVATION_LIST.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.loinc.display}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          {key === 'bloodPressure' ? (
            <div className="hp-row" style={{ alignItems: 'flex-end' }}>
              <Field label={t('forms.systolic')}>
                {({ id }) => (
                  <TextInput
                    id={id}
                    type="number"
                    inputMode="numeric"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                  />
                )}
              </Field>
              <Field label={t('forms.diastolic')}>
                {({ id }) => (
                  <TextInput
                    id={id}
                    type="number"
                    inputMode="numeric"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                  />
                )}
              </Field>
              <span className="hp-field__hint" style={{ paddingBottom: 12 }}>
                mmHg
              </span>
            </div>
          ) : (
            <Field label={t('forms.value')}>
              {({ id }) => (
                <div className="hp-input-group">
                  <TextInput
                    id={id}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                  {unitChoices.length > 1 ? (
                    <Select
                      aria-label={t('forms.unit')}
                      value={unitCode}
                      onChange={(e) => setUnitCode(e.target.value)}
                    >
                      {unitChoices.map((u) => (
                        <option key={u.code} value={u.code}>
                          {u.unit}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <span className="hp-field__hint" style={{ alignSelf: 'center' }}>
                      {unit.unit}
                    </span>
                  )}
                </div>
              )}
            </Field>
          )}

          <Field label={t('forms.when')}>
            {({ id }) => (
              <TextInput
                id={id}
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
            )}
          </Field>

          <Field label={t('forms.note')}>
            {({ id }) => (
              <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} />
            )}
          </Field>

          {error && (
            <Notice tone="caution" icon="⚠️" role="alert">
              {error}
            </Notice>
          )}

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
