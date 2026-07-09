import { useI18n } from '../../i18n/I18nProvider';
import { ComingSoon } from '../../ui/ComingSoon';

export function LearnScreen() {
  const { t } = useI18n();
  return (
    <ComingSoon
      title={t('nav.learn')}
      note="Safe, evidence-based education — reviewed and cited — is added with the clinical-safety phase."
    />
  );
}
