/**
 * chain.ts — immutable, hash-chained audit log (Vol 8 §audit, HIPAA).
 *
 * Every access to PHI and every clinical action is appended here. Each record's hash
 * covers the previous record's hash, so any tampering (edit/delete/reorder) breaks the
 * chain and is detectable by verifyChain(). This is the pure model; the infra layer
 * persists records and upgrades the hash to SHA-256 (node:crypto) — the linking logic
 * is identical and lives here so it can be unit-tested.
 */
import { djb2 } from "../hash.js";

export interface AuditEntry {
  actorId: string | null;
  action: string;
  target: string | null;
  occurredAt: number; // epoch ms
}

export interface AuditRecord extends AuditEntry {
  seq: number;
  prevHash: string | null;
  hash: string;
}

const GENESIS = "genesis";

/** Hash an entry together with the previous hash (the chain link). */
export function chainHash(prevHash: string | null, entry: AuditEntry): string {
  const payload = `${prevHash ?? GENESIS}|${entry.actorId ?? ""}|${entry.action}|${entry.target ?? ""}|${entry.occurredAt}`;
  return djb2(payload);
}

/** Append an entry, returning the new immutable record (does not mutate `log`). */
export function appendEntry(log: readonly AuditRecord[], entry: AuditEntry): AuditRecord {
  const prev = log.length > 0 ? log[log.length - 1]! : null;
  const prevHash = prev ? prev.hash : null;
  return { ...entry, seq: (prev?.seq ?? 0) + 1, prevHash, hash: chainHash(prevHash, entry) };
}

export interface ChainVerification {
  ok: boolean;
  brokenAt: number | null; // seq of the first broken record, or null
}

/** Verify the whole chain is internally consistent and untampered. */
export function verifyChain(log: readonly AuditRecord[]): ChainVerification {
  let prevHash: string | null = null;
  for (const rec of log) {
    if (rec.prevHash !== prevHash) return { ok: false, brokenAt: rec.seq };
    if (rec.hash !== chainHash(prevHash, rec)) return { ok: false, brokenAt: rec.seq };
    prevHash = rec.hash;
  }
  return { ok: true, brokenAt: null };
}
