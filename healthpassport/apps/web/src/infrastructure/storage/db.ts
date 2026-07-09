import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/**
 * IndexedDB layout. Record bodies are AES-GCM ciphertext; only low-sensitivity
 * metadata (resourceType, id, updatedAt) is stored in the clear to allow
 * listing by type without decrypting everything. See docs/SECURITY.md.
 */
export interface StoredRecord {
  id: string;
  resourceType: string;
  updatedAt: string;
  iv: Uint8Array;
  ct: Uint8Array;
}

export interface MetaRecord {
  key: string;
  value: unknown;
}

export interface AuditRecord {
  seq?: number;
  at: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  prevHash: string;
  hash: string;
}

export interface HealthPassportDB extends DBSchema {
  records: {
    key: string;
    value: StoredRecord;
    indexes: { byType: string };
  };
  meta: {
    key: string;
    value: MetaRecord;
  };
  audit: {
    key: number;
    value: AuditRecord;
  };
}

export type HpDatabase = IDBPDatabase<HealthPassportDB>;

export const DB_NAME = 'healthpassport';
const DB_VERSION = 1;

export function openHpDb(name: string = DB_NAME): Promise<HpDatabase> {
  return openDB<HealthPassportDB>(name, DB_VERSION, {
    upgrade(db) {
      const records = db.createObjectStore('records', { keyPath: 'id' });
      records.createIndex('byType', 'resourceType');
      db.createObjectStore('meta', { keyPath: 'key' });
      db.createObjectStore('audit', { keyPath: 'seq', autoIncrement: true });
    },
  });
}
