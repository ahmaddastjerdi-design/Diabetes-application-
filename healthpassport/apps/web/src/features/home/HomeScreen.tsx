import { useI18n } from '../../i18n/I18nProvider';
import { Card, Notice, PageHeader, Stack } from '../../ui/primitives';

export function HomeScreen() {
  const { t } = useI18n();
  return (
    <Stack>
      <PageHeader title={t('home.greeting')} subtitle={t('home.todayOverview')} />

      <Notice tone="info" icon="ℹ️" role="note">
        {t('disclaimer.banner')}
      </Notice>

      <Card>
        <h2 className="hp-card__title">{t('home.todayOverview')}</h2>
        <p className="hp-card__subtitle">{t('home.nothingYet')}</p>
      </Card>
    </Stack>
  );
}
