import { useI18n } from '../../i18n/I18nProvider';
import { ComingSoon } from '../../ui/ComingSoon';

export function CareScreen() {
  const { t } = useI18n();
  return (
    <ComingSoon
      title={t('nav.care')}
      note="Chronic-care tracking for diabetes and blood pressure — targets and trends — arrives in a later phase."
    />
  );
}
