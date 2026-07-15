/**
 * Object-storage port. Documents live here (never in the database or web root);
 * the DB stores only metadata + the storage key. The Phase-7 implementation is a
 * local filesystem adapter; a production S3-compatible adapter implements the
 * same interface (docs/SCALABILITY_PLAN.md §3, docs/DEPLOYMENT.md §2).
 */
export interface StorageAdapter {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}

/** Reject keys that could escape the storage root. Keys are server-generated. */
export function assertSafeKey(key: string): void {
  if (!/^[A-Za-z0-9._-]+$/.test(key)) {
    throw new Error('Unsafe storage key');
  }
}
