/**
 * merge.ts — offline sync & conflict resolution (Vol 4 §sync, Vol 5 §queue).
 *
 * Two kinds of state sync from the offline-first client:
 *  1. Append-only EVENTS (actions, lessons) — deduped by idempotency id; the server's
 *     event log is the authority and XP/streak/badges are re-derived from it (progress.ts).
 *  2. Last-write-wins SCALAR state (e.g. profile fields) — newest `updatedAt` wins.
 * Pure functions so the contract is unit-testable and identical on client and server.
 */

export interface Identified<T> {
  id: string; // idempotency key
  event: T;
}

/** Keep only incoming events whose id the server hasn't already stored (dedup). */
export function dedupeEvents<T>(seenIds: ReadonlySet<string>, incoming: readonly Identified<T>[]): Identified<T>[] {
  const seen = new Set(seenIds);
  const fresh: Identified<T>[] = [];
  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    seen.add(item.id); // also dedupe within the batch itself
    fresh.push(item);
  }
  return fresh;
}

export interface Versioned<T> {
  value: T;
  updatedAt: number; // epoch ms
}

/**
 * Last-write-wins merge for a scalar field. Ties (equal timestamps) resolve to the
 * remote/server value for determinism — a client cannot override the server by
 * replaying the same timestamp.
 */
export function mergeLWW<T>(local: Versioned<T>, remote: Versioned<T>): Versioned<T> {
  return local.updatedAt > remote.updatedAt ? local : remote;
}
