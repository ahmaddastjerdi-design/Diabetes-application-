import { useI18n } from '../../i18n/I18nProvider';
import { ComingSoon } from '../../ui/ComingSoon';

export function ReportScreen() {
  const { t } = useI18n();
  return (
    <ComingSoon
      title={t('nav.report')}
      note="Physician-ready reports and FHIR export are built once the record and chronic-care data exist."
    />
  );
}
