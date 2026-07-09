import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button, Card, Notice, Stack } from '../../ui/primitives';
import { useSession } from '../../state/SessionProvider';
import { WrongPassphraseError } from '../../infrastructure/session/vault';
import { PassphraseField } from './PassphraseField';
import './AuthScreen.css';

export function UnlockScreen() {
  const { t } = useI18n();
  const { unlock } = useSession();
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (!pass || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await unlock(pass);
    } catch (e) {
      setError(
        e instanceof WrongPassphraseError
          ? t('unlock.wrong')
          : 'Something went wrong. Please try again.',
      );
      setPass('');
      setBusy(false);
    }
  }

  return (
    <div className="hp-auth">
      <div className="hp-auth__card">
        <div className="hp-auth__brand">
          <img className="hp-auth__logo" src="/icon.svg" alt="" aria-hidden="true" />
          <span className="hp-auth__name">{t('app.name')}</span>
          <span className="hp-auth__tagline">🔒 {t('unlock.locked')}</span>
        </div>
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void onSubmit();
            }}
          >
            <Stack>
              <div>
                <h1 className="hp-card__title">{t('unlock.title')}</h1>
                <p className="hp-card__subtitle">{t('unlock.subtitle')}</p>
              </div>
              <PassphraseField
                label={t('unlock.passphrase')}
                value={pass}
                onChange={setPass}
                autoComplete="current-password"
                autoFocus
              />
              {error && (
                <Notice tone="alert" icon="⚠️" role="alert">
                  {error}
                </Notice>
              )}
              <Button type="submit" block disabled={!pass || busy}>
                {t('unlock.unlock')}
              </Button>
            </Stack>
          </form>
        </Card>
      </div>
    </div>
  );
}
