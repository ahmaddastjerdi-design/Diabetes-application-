import type { ReportSummary } from './build';

/** Render the report summary as plain text (for copy-to-clipboard / sharing). */
export function summaryToText(s: ReportSummary): string {
  const lines: string[] = [];
  lines.push('HealthPassport Pro — patient-generated summary');
  lines.push(`Generated: ${s.generatedAt.slice(0, 10)}`);
  if (s.patient.name) lines.push(`Patient: ${s.patient.name}`);
  if (s.patient.birthDate) lines.push(`Date of birth: ${s.patient.birthDate}`);
  if (s.patient.sex) lines.push(`Sex: ${s.patient.sex}`);
  lines.push('');

  if (s.flags.length) {
    lines.push('ATTENTION:');
    for (const f of s.flags) lines.push(`  - [${f.disposition}] ${f.detail}`);
    lines.push('');
  }

  const section = (title: string, items: string[]) => {
    lines.push(`${title}:`);
    if (items.length === 0) lines.push('  - None recorded');
    else for (const i of items) lines.push(`  - ${i}`);
    lines.push('');
  };

  section(
    'Conditions',
    s.conditions.map((c) => `${c.display} (${c.status}${c.onset ? `, since ${c.onset}` : ''})`),
  );
  section(
    'Medications',
    s.medications.map((m) => `${m.name}${m.dosage ? ` — ${m.dosage}` : ''} (${m.status})`),
  );
  section(
    'Allergies',
    s.allergies.map((a) => `${a.substance}${a.reaction ? ` — ${a.reaction}` : ''}`),
  );
  section(
    'Latest vitals',
    s.latestVitals.map((v) => `${v.label}: ${v.value} (${v.recordedAt})`),
  );
  section(
    'Latest labs',
    s.latestLabs.map((l) => `${l.label}: ${l.value} (${l.recordedAt})`),
  );

  lines.push(
    'This patient-generated summary is for discussion with a clinician. It is not a diagnosis and may be incomplete.',
  );
  return lines.join('\n');
}
