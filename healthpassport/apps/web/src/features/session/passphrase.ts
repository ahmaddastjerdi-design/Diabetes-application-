export type PassphraseStrength = 'weak' | 'fair' | 'strong';

export const MIN_PASSPHRASE_LENGTH = 8;

/**
 * A deliberately simple, offline strength heuristic. It nudges toward longer,
 * varied passphrases; it is NOT the security boundary (PBKDF2 iteration count
 * is — see docs/SECURITY.md). Returns a 0–3 score and a label.
 */
export function estimatePassphraseStrength(value: string): {
  score: 0 | 1 | 2 | 3;
  label: PassphraseStrength;
} {
  if (value.length < MIN_PASSPHRASE_LENGTH) return { score: 0, label: 'weak' };

  let variety = 0;
  if (/[a-z]/.test(value)) variety += 1;
  if (/[A-Z]/.test(value)) variety += 1;
  if (/[0-9]/.test(value)) variety += 1;
  if (/[^A-Za-z0-9]/.test(value)) variety += 1;

  const long = value.length >= 12;
  const veryLong = value.length >= 16;

  if ((veryLong && variety >= 2) || (variety >= 3 && long)) {
    return { score: 3, label: 'strong' };
  }
  if (long || variety >= 3) return { score: 2, label: 'fair' };
  return { score: 1, label: 'weak' };
}

export function isPassphraseAcceptable(value: string): boolean {
  return value.length >= MIN_PASSPHRASE_LENGTH;
}
