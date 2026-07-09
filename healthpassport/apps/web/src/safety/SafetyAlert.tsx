import { useI18n } from '../i18n/I18nProvider';
import { Notice } from '../ui/primitives';
import type { SafetyEvaluation } from './types';

/**
 * Renders a clinical-safety escalation. The UI must honor the disposition:
 * EMERGENCY is loudest and suppresses any reassuring copy; ROUTINE renders
 * nothing here (handled by normal display). See docs/CLINICAL_SAFETY.md §2.
 */
export function SafetyAlert({ evaluation }: { evaluation: SafetyEvaluation }) {
  const { t } = useI18n();
  if (evaluation.disposition === 'ROUTINE') return null;

  const isEmergency = evaluation.disposition === 'EMERGENCY';
  const title = isEmergency ? t('safety.emergencyTitle') : t('safety.urgentTitle');
  const body = isEmergency ? t('safety.emergencyBody') : t('safety.urgentBody');

  return (
    <Notice tone={isEmergency ? 'alert' : 'caution'} icon={isEmergency ? '🚨' : '⚠️'} role="alert">
      <strong>{title}</strong>
      <p style={{ marginTop: 4 }}>{body}</p>
      <ul style={{ margin: '8px 0 0', paddingInlineStart: 18 }}>
        {evaluation.findings.map((f) => (
          <li key={f.code}>{f.detail}</li>
        ))}
      </ul>
      {isEmergency && (
        <p style={{ marginTop: 8, fontWeight: 700 }}>{t('safety.callEmergency')}</p>
      )}
    </Notice>
  );
}
