import { AlertTriangle, Siren } from 'lucide-react';
import type { Disposition, Finding } from '@/lib/medical-rules';
import { cn } from '@/lib/utils/cn';

/**
 * Renders a clinical-safety escalation. EMERGENCY is loudest and suppresses
 * reassuring copy; ROUTINE renders nothing (docs/MEDICAL_SAFETY_RULES.md §3).
 */
export function SafetyAlert({
  evaluation,
}: {
  evaluation: { disposition: Disposition; findings: Finding[] };
}) {
  if (evaluation.disposition === 'ROUTINE') return null;
  const emergency = evaluation.disposition === 'EMERGENCY';

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-md border p-4 text-sm',
        emergency
          ? 'border-destructive bg-destructive/10 text-destructive'
          : 'border-warning bg-warning/10 text-warning',
      )}
    >
      {emergency ? (
        <Siren aria-hidden className="mt-0.5 size-5 shrink-0" />
      ) : (
        <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0" />
      )}
      <div className="space-y-1">
        <p className="font-semibold">
          {emergency
            ? 'This may need emergency care'
            : 'Contact your care team promptly'}
        </p>
        <ul className="list-disc space-y-0.5 pl-4">
          {evaluation.findings.map((f) => (
            <li key={f.code}>{f.detail}</li>
          ))}
        </ul>
        {emergency && (
          <p className="font-semibold">
            For urgent symptoms such as chest pain, severe shortness of breath,
            fainting, stroke-like symptoms, or severe weakness, seek emergency
            medical care.
          </p>
        )}
        <p className="text-xs opacity-80">
          Ranges are guidance, not a diagnosis. Discuss any concerns with your
          care team.
        </p>
      </div>
    </div>
  );
}
