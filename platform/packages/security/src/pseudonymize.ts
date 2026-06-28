/**
 * pseudonymize.ts — stable pseudonyms for de-identified analytics (Vol 8 §privacy-by-design).
 * The keyed hash (HMAC) is injected so this stays pure and testable; the production
 * hasher (infra) uses HMAC-SHA256 with a secret salt so pseudonyms can't be reversed
 * or linked without the key.
 */
export interface Hasher {
  hmac(input: string): string;
}

/** Deterministic, non-reversible pseudonym for an identifier. */
export function pseudonym(id: string, hasher: Hasher): string {
  return `pid_${hasher.hmac(id).slice(0, 16)}`;
}

/** Replace direct identifiers in a record with pseudonyms (analytics de-identification). */
export function deidentify(
  record: Record<string, unknown>,
  idFields: readonly string[],
  hasher: Hasher
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...record };
  for (const f of idFields) {
    if (typeof out[f] === "string") out[f] = pseudonym(out[f] as string, hasher);
  }
  return out;
}
