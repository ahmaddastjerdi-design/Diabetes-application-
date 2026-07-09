import { useI18n } from '../../i18n/I18nProvider';
import { Button, Card, EmptyState } from '../../ui/primitives';
import { Sparkline } from '../../ui/Sparkline';
import type { Observation } from '../../domain/resources';
import { bloodPressureSeries, latest, trend } from './analytics';
import { StatTile } from './StatTile';
import './care.css';

export function HypertensionCard({
  observations,
  onAdd,
}: {
  observations: Observation[];
  onAdd: () => void;
}) {
  const { t } = useI18n();
  const { systolic, diastolic } = bloodPressureSeries(observations);
  const lastSys = latest(systolic);
  const lastDia = latest(diastolic);

  // Simple tone: elevated systolic (>=130) cautions, crisis range alerts.
  const sysTone =
    lastSys === undefined
      ? undefined
      : lastSys.value >= 180
        ? 'alert'
        : lastSys.value >= 130
          ? 'caution'
          : 'ok';

  const trendLabel = {
    up: t('care.trendUp'),
    down: t('care.trendDown'),
    flat: t('care.trendFlat'),
  }[trend(systolic)];

  return (
    <Card>
      <div className="hp-section-head">
        <h2 className="hp-section-head__title">🫀 {t('care.hypertension')}</h2>
        <Button variant="ghost" onClick={onAdd}>
          + {t('care.addReading')}
        </Button>
      </div>

      {systolic.length === 0 ? (
        <EmptyState>{t('care.noData')}</EmptyState>
      ) : (
        <>
          <div className="hp-stats">
            {lastSys && lastDia && (
              <StatTile
                label={t('care.latest')}
                value={`${Math.round(lastSys.value)}/${Math.round(lastDia.value)}`}
                unit="mmHg"
                tone={sysTone}
              />
            )}
            <StatTile label={t('care.target')} value="<120/80" unit="mmHg" />
          </div>

          <div className="hp-spark-wrap">
            <Sparkline
              values={systolic.map((p) => p.value)}
              ariaLabel={`${t('care.hypertension')}: ${systolic.length} systolic readings`}
              band={{ low: 90, high: 120 }}
            />
            <div className="hp-trend">
              {trendLabel} · {t('care.readingsCount', { count: systolic.length })}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
