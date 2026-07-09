import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button, Card, Notice, Stack } from '../../ui/primitives';
import { useSession } from '../../state/SessionProvider';
import { PassphraseField } from '../session/PassphraseField';
import {
  estimatePassphraseStrength,
  isPassphraseAcceptable,
} from '../session/passphrase';
import '../session/AuthScreen.css';

function Brand() {
  const { t } = useI18n();
  return (
    <div className="hp-auth__brand">
      <img className="hp-auth__logo" src="/icon.svg" alt="" aria-hidden="true" />
      <span className="hp-auth__name">{t('app.name')}</span>
      <span className="hp-auth__tagline">{t('app.tagline')}</span>
    </div>
  );
}

function StrengthMeter({ value }: { value: string }) {
  const { t } = useI18n();
  const { score, label } = estimatePassphraseStrength(value);
  const labelText =
    label === 'strong' ? t('setup.strong') : label === 'fair' ? t('setup.fair') : t('setup.weak');
  const cls =
    label === 'strong' ? 'on-strong' : label === 'fair' ? 'on-fair' : 'on-weak';
  return (
    <div>
      <div className="hp-strength" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`hp-strength__bar${i < score ? ` hp-strength__bar--${cls}` : ''}`}
          />
        ))}
      </div>
      {value.length > 0 && (
        <span className="hp-field__hint">
          {t('setup.strength')}: {labelText}
        </span>
      )}
    </div>
  );
}

export function OnboardingFlow() {
  const { t } = useI18n();
  const { initialize } = useSession();
  const [step, setStep] = useState<'welcome' | 'passphrase'>('welcome');
  const [acked, setAcked] = useState(false);
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const passError =
    pass.length > 0 && !isPassphraseAcceptable(pass) ? t('setup.tooShort') : undefined;
  const confirmError =
    confirm.length > 0 && confirm !== pass ? t('setup.mismatch') : undefined;
  const canCreate =
    isPassphraseAcceptable(pass) && pass === confirm && !submitting;

  async function onCreate() {
    if (!canCreate) return;
    setSubmitting(true);
    setError(undefined);
    try {
      await initialize(pass);
    } catch {
      setError('Could not create your record. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="hp-auth">
      <div className="hp-auth__card">
        <Brand />
        {step === 'welcome' ? (
          <Card>
            <Stack>
              <div>
                <h1 className="hp-card__title">{t('onboarding.welcomeTitle')}</h1>
                <p className="hp-card__subtitle">{t('onboarding.welcomeBody')}</p>
              </div>
              <div>
                <h2 className="hp-card__title" style={{ fontSize: 'var(--hp-fs-md)' }}>
                  🔒 {t('onboarding.privacyTitle')}
                </h2>
                <p className="hp-card__subtitle">{t('onboarding.privacyBody')}</p>
              </div>
              <div>
                <h2 className="hp-card__title" style={{ fontSize: 'var(--hp-fs-md)' }}>
                  ⚕️ {t('onboarding.safetyTitle')}
                </h2>
                <p className="hp-card__subtitle">{t('onboarding.safetyBody')}</p>
              </div>
              <label className="hp-ack">
                <input
                  type="checkbox"
                  checked={acked}
                  onChange={(e) => setAcked(e.target.checked)}
                />
                <span className="hp-ack__text">{t('onboarding.acknowledge')}</span>
              </label>
              <Button
                block
                disabled={!acked}
                onClick={() => setStep('passphrase')}
              >
                {t('onboarding.getStarted')}
              </Button>
            </Stack>
          </Card>
        ) : (
          <Card>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void onCreate();
              }}
            >
              <Stack>
                <div>
                  <h1 className="hp-card__title">{t('setup.title')}</h1>
                  <p className="hp-card__subtitle">{t('setup.subtitle')}</p>
                </div>
                <div>
                  <PassphraseField
                    label={t('setup.passphrase')}
                    value={pass}
                    onChange={setPass}
                    error={passError}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <StrengthMeter value={pass} />
                </div>
                <PassphraseField
                  label={t('setup.confirm')}
                  value={confirm}
                  onChange={setConfirm}
                  error={confirmError}
                  autoComplete="new-password"
                />
                <Notice tone="caution" icon="⚠️">
                  {t('setup.warning')}
                </Notice>
                {error && (
                  <Notice tone="alert" icon="⚠️" role="alert">
                    {error}
                  </Notice>
                )}
                <Button type="submit" block disabled={!canCreate}>
                  {t('setup.create')}
                </Button>
              </Stack>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
