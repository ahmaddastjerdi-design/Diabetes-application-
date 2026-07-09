import { useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button, Card, EmptyState, Notice, PageHeader, Stack } from '../../ui/primitives';
import { formatDate, formatDateTime } from '../../ui/format';
import { useRecords } from '../../state/RecordsProvider';
import { useRepository } from '../../state/SessionProvider';
import { buildReport, type ReportModel } from './summary';
import { toFhirBundle } from './fhir';
import { dateStamp, downloadJson } from './download';
import './report.css';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="hp-report__row">
      <span className="hp-report__key">{label}</span>
      <span className="hp-report__val">{value}</span>
    </div>
  );
}

export function ReportScreen() {
  const { t, locale } = useI18n();
  const { resources } = useRecords();
  const repository = useRepository();

  // Fixed timestamp per render pass; regenerates on data change.
  const report: ReportModel = useMemo(
    () => buildReport(resources, new Date().toISOString()),
    [resources],
  );

  async function downloadFhir() {
    // exportAll() records the audit 'export' event and returns authoritative data.
    const all = await repository.exportAll();
    const bundle = toFhirBundle(all, new Date().toISOString());
    downloadJson(`healthpassport-fhir-${dateStamp(report.generatedAt)}.json`, bundle);
  }

  function downloadSummary() {
    downloadJson(`healthpassport-summary-${dateStamp(report.generatedAt)}.json`, report);
  }

  if (resources.length === 0) {
    return (
      <Stack>
        <PageHeader title={t('report.title')} />
        <Card>
          <EmptyState>{t('report.empty')}</EmptyState>
        </Card>
      </Stack>
    );
  }

  const { patient, vitals, conditions, medications, allergies, flags } = report;

  return (
    <Stack>
      <PageHeader title={t('report.title')} subtitle={t('report.subtitle')} />

      <div className="hp-row hp-wrap hp-no-print" style={{ gap: 'var(--hp-space-2)' }}>
        <Button onClick={() => window.print()}>🖨 {t('report.print')}</Button>
        <Button variant="secondary" onClick={() => void downloadFhir()}>
          {t('report.downloadFhir')}
        </Button>
        <Button variant="secondary" onClick={downloadSummary}>
          {t('report.downloadSummary')}
        </Button>
      </div>

      <Card className="hp-report">
        <p className="hp-field__hint">
          {t('report.generatedAt')}: {formatDateTime(report.generatedAt, locale)} ·{' '}
          {t('report.forClinician')}
        </p>

        {flags.length > 0 && (
          <div className="hp-report__section">
            <Notice tone="alert" icon="⚠️" role="note">
              <strong>{t('report.flags')}</strong>
              <ul style={{ margin: '4px 0 0', paddingInlineStart: 18 }}>
                {flags.map((f, i) => (
                  <li key={i}>{f.detail}</li>
                ))}
              </ul>
            </Notice>
          </div>
        )}

        <div className="hp-report__section">
          <h3>{t('report.patient')}</h3>
          {patient.name && <Row label={t('profile.given')} value={patient.name} />}
          {patient.birthDate && (
            <Row label={t('profile.birthDate')} value={formatDate(patient.birthDate, locale)} />
          )}
          {patient.gender && (
            <Row label={t('profile.gender')} value={t(`profile.${patient.gender}` as 'profile.male')} />
          )}
        </div>

        <div className="hp-report__section">
          <h3>{t('report.vitals')}</h3>
          {vitals.latestGlucoseMgdl && (
            <Row
              label={t('report.latestGlucose')}
              value={`${vitals.latestGlucoseMgdl.value} mg/dL · ${formatDate(vitals.latestGlucoseMgdl.at, locale)}`}
            />
          )}
          {vitals.estimatedA1c !== undefined && (
            <Row label={t('report.estimatedA1c')} value={`${vitals.estimatedA1c} %`} />
          )}
          {vitals.latestHba1c && (
            <Row
              label={t('report.latestHba1c')}
              value={`${vitals.latestHba1c.value} % · ${formatDate(vitals.latestHba1c.at, locale)}`}
            />
          )}
          {vitals.latestBp && (
            <Row
              label={t('report.latestBp')}
              value={`${vitals.latestBp.systolic}/${vitals.latestBp.diastolic} mmHg · ${formatDate(vitals.latestBp.at, locale)}`}
            />
          )}
          {vitals.latestWeight && (
            <Row
              label={t('report.latestWeight')}
              value={`${vitals.latestWeight.value} ${vitals.latestWeight.unit}`}
            />
          )}
        </div>

        <div className="hp-report__section">
          <h3>{t('report.conditions')}</h3>
          {conditions.length ? (
            <ul>
              {conditions.map((c, i) => (
                <li key={i}>
                  {c.text}
                  {c.onsetDate ? ` (${formatDate(c.onsetDate, locale)})` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="hp-report__key">{t('common.none')}</p>
          )}
        </div>

        <div className="hp-report__section">
          <h3>{t('report.medications')}</h3>
          {medications.length ? (
            <ul>
              {medications.map((m, i) => (
                <li key={i}>
                  {m.text}
                  {m.dosage ? ` — ${m.dosage}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="hp-report__key">{t('common.none')}</p>
          )}
        </div>

        <div className="hp-report__section">
          <h3>{t('report.allergies')}</h3>
          {allergies.length ? (
            <ul>
              {allergies.map((a, i) => (
                <li key={i}>
                  {a.text}
                  {a.reaction ? ` — ${a.reaction}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="hp-report__key">{t('common.none')}</p>
          )}
        </div>

        <p className="hp-field__hint" style={{ marginTop: 'var(--hp-space-4)' }}>
          {t('report.disclaimer')}
        </p>
      </Card>
    </Stack>
  );
}
