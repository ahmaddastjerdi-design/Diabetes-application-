import { sha256Hex } from '../crypto/cryptoService';
import type { AuditRecord, HpDatabase } from '../storage/db';
import { nowInstant } from '../../domain/ids';

export type AuditAction = 'put' | 'remove' | 'export' | 'clear' | 'unlock';

const GENESIS = 'GENESIS';

/**
 * Append-only, hash-chained access log. Each entry's hash covers the previous
 * hash, so any deletion or edit of history is detectable (`verifyChain`). It
 * records *that* PHI was accessed, never the values themselves.
 */
export class AuditLog {
  constructor(private readonly db: HpDatabase) {}

  private async lastHash(): Promise<string> {
    const cursor = await this.db
      .transaction('audit')
      .store.openCursor(null, 'prev');
    return cursor?.value.hash ?? GENESIS;
  }

  async record(
    action: AuditAction,
    resourceType?: string,
    resourceId?: string,
  ): Promise<void> {
    const prevHash = await this.lastHash();
    const partial: Omit<AuditRecord, 'hash' | 'seq'> = {
      at: nowInstant(),
      action,
      prevHash,
      ...(resourceType ? { resourceType } : {}),
      ...(resourceId ? { resourceId } : {}),
    };
    const hash = await sha256Hex(prevHash + JSON.stringify(partial));
    await this.db.add('audit', { ...partial, hash });
  }

  async list(): Promise<AuditRecord[]> {
    return this.db.getAll('audit');
  }

  /** Recompute the chain; returns false if any entry was altered or removed. */
  async verifyChain(): Promise<boolean> {
    const all = await this.list();
    let prevHash = GENESIS;
    for (const entry of all) {
      if (entry.prevHash !== prevHash) return false;
      const { hash, seq: _seq, ...partial } = entry;
      void _seq;
      const expected = await sha256Hex(prevHash + JSON.stringify(partial));
      if (expected !== hash) return false;
      prevHash = hash;
    }
    return true;
  }
}
