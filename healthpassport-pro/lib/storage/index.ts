import { join } from 'node:path';
import { LocalStorageAdapter } from './local';
import type { StorageAdapter } from './types';

export type { StorageAdapter } from './types';

let adapter: StorageAdapter | undefined;

/**
 * Resolve the storage adapter. Phase 7 uses the local filesystem; when
 * STORAGE_ENDPOINT/STORAGE_BUCKET are configured, an S3 adapter is selected here
 * (same interface, no call-site changes) — see docs/DEPLOYMENT.md §2.
 */
export function getStorage(): StorageAdapter {
  if (adapter) return adapter;
  // Future: if (process.env.STORAGE_ENDPOINT) adapter = new S3StorageAdapter(...)
  const dir = process.env.STORAGE_LOCAL_DIR ?? join(process.cwd(), '.uploads');
  adapter = new LocalStorageAdapter(dir);
  return adapter;
}
