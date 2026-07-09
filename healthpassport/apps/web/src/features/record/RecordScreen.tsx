import { useI18n } from '../../i18n/I18nProvider';
import { ComingSoon } from '../../ui/ComingSoon';

export function RecordScreen() {
  const { t } = useI18n();
  return (
    <ComingSoon
      title={t('nav.record')}
      note="Your personal health record — conditions, medications, allergies, and readings — is built in the next phase."
    />
  );
}
