import { useI18n } from '../../i18n/I18nProvider';
import { Button, Card, EmptyState } from '../../ui/primitives';
import { Sparkline } from '../../ui/Sparkline';
import { compareToReference } from '../../safety/engine';
import { REFERENCE_RANGES } from '../../safety/referenceRanges';
import type { Observation } from '../../domain/resources';
import {
  estimatedA1c,
  glucoseSeries,
  latest,
  trend,
} from './analytics';
import { StatTile, toneForComparison } from './StatTile';
import './care.css';

export function DiabetesCard({
  observations,
  onAdd,
}: {
  observations: Observation[];
  onAdd: () => void;
}) {
  const { t } = useI18n();
  const series = glucoseSeries(observations);
  const last = latest(series);
  const a1c = estimatedA1c(series);
  const band = REFERENCE_RANGES.glucose;

  const trendLabel = {
    up: t('care.trendUp'),
    down: t('care.trendDown'),
    flat: t('care.trendFlat'),
  }[trend(series)];

  return (
    <Card>
      <div className="hp-section-head">
        <h2 className="hp-section-head__title">🩸 {t('care.diabetes')}</h2>
        <Button variant="ghost" onClick={onAdd}>
          + {t('care.addReading')}
        </Button>
      </div>

      {series.length === 0 ? (
        <EmptyState>{t('care.noData')}</EmptyState>
      ) : (
        <>
          <div className="hp-stats">
            {last && (
              <StatTile
                label={t('care.latest')}
                value={String(Math.round(last.value))}
                unit="mg/dL"
                tone={toneForComparison(
                  compareToReference('glucose', last.value)?.comparison,
                )}
              />
            )}
            {a1c !== undefined && (
              <StatTile
                label={t('care.estimatedA1c')}
                value={`${a1c}`}
                unit="%"
              />
            )}
            {band && (
              <StatTile
                label={t('care.target')}
                value={`${band.low}–${band.high}`}
                unit="mg/dL"
              />
            )}
          </div>

          <div className="hp-spark-wrap">
            <Sparkline
              values={series.map((p) => p.value)}
              ariaLabel={`${t('care.diabetes')} ${t('care.trendFlat')}: ${series.length} readings`}
              band={band ? { low: band.low, high: band.high } : undefined}
            />
            <div className="hp-trend">
              {trendLabel} · {t('care.readingsCount', { count: series.length })}
            </div>
          </div>

          {a1c !== undefined && (
            <p className="hp-field__hint" style={{ marginTop: 'var(--hp-space-2)' }}>
              {t('care.estimatedA1cNote')}
            </p>
          )}
        </>
      )}
    </Card>
  );
}
