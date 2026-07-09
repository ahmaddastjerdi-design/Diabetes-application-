import type { Tone } from '../../ui/primitives';

/** A labeled metric with an optional clinical tone (from the safety palette). */
export function StatTile({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: Extract<Tone, 'ok' | 'caution' | 'alert'>;
}) {
  return (
    <div className={`hp-stat${tone ? ` hp-stat--${tone}` : ''}`}>
      <div className="hp-stat__label">{label}</div>
      <div className="hp-stat__value">
        {value}
        {unit && <span className="hp-stat__unit"> {unit}</span>}
      </div>
    </div>
  );
}

/** Map a reference comparison to a display tone. */
export function toneForComparison(
  comparison: 'below' | 'in-range' | 'above' | 'unknown' | undefined,
): 'ok' | 'caution' | undefined {
  if (comparison === 'in-range') return 'ok';
  if (comparison === 'above' || comparison === 'below') return 'caution';
  return undefined;
}
