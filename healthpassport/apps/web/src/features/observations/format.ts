import type { Observation } from '../../domain/resources';

/** Human label for what the observation measured. */
export function observationLabel(o: Observation): string {
  return o.code.text || o.code.coding[0]?.display || 'Reading';
}

/** Formatted value, e.g. "132 mg/dL" or "120/80 mmHg". */
export function observationValue(o: Observation): string {
  if (o.components && o.components.length >= 2) {
    const [a, b] = o.components;
    const unit = a?.valueQuantity.unit ?? '';
    return `${a?.valueQuantity.value ?? '?'}/${b?.valueQuantity.value ?? '?'} ${unit}`.trim();
  }
  if (o.valueQuantity) {
    return `${o.valueQuantity.value} ${o.valueQuantity.unit}`.trim();
  }
  return '—';
}
