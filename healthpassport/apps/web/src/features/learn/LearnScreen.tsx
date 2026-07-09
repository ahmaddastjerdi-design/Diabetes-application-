import { useI18n } from '../../i18n/I18nProvider';
import { Card, Notice, PageHeader, Stack } from '../../ui/primitives';
import { formatDate } from '../../ui/format';
import { EDUCATION_ITEMS } from './content';

export function LearnScreen() {
  const { t, locale } = useI18n();
  return (
    <Stack>
      <PageHeader title={t('learn.title')} />
      <Notice tone="info" icon="📚" role="note">
        {t('learn.intro')}
      </Notice>
      {EDUCATION_ITEMS.map((item) => (
        <Card key={item.id}>
          <h2 className="hp-card__title">{item.title}</h2>
          <Stack style={{ gap: 'var(--hp-space-2)', marginTop: 'var(--hp-space-2)' }}>
            {item.body.map((p, i) => (
              <p key={i} style={{ color: 'var(--hp-text-muted)' }}>
                {p}
              </p>
            ))}
          </Stack>
          <p className="hp-field__hint" style={{ marginTop: 'var(--hp-space-3)' }}>
            {t('learn.source')}: {item.source} · {t('learn.reviewed')}:{' '}
            {formatDate(item.lastReviewed, locale)}
          </p>
        </Card>
      ))}
    </Stack>
  );
}
