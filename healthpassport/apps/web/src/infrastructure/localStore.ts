import { AuditLog } from './audit/auditLog';
import { Vault } from './session/vault';
import { EncryptedIndexedDbRepository } from './storage/encryptedRepository';
import { openHpDb } from './storage/db';
import type { HealthRecordRepository } from '../domain/repository';

/**
 * The local, offline-first persistence stack: an encrypted repository, the
 * session vault that guards it, and a tamper-evident audit log — all sharing
 * one IndexedDB database. Feature code depends on `repository`
 * (a HealthRecordRepository) and `vault`; the concrete types stay here.
 */
export interface LocalHealthStore {
  vault: Vault;
  repository: HealthRecordRepository;
  audit: AuditLog;
  /**
   * Irreversibly erase everything — records, audit trail, and the vault's key
   * material — returning the app to first-run state. Backs the patient's right
   * to erasure (GDPR Art. 17).
   */
  wipe: () => Promise<void>;
  /** Close the underlying IndexedDB connection (on teardown/unmount). */
  close: () => void;
}

export async function createLocalHealthStore(
  dbName?: string,
): Promise<LocalHealthStore> {
  const db = await openHpDb(dbName);
  const audit = new AuditLog(db);
  const vault = new Vault(db);
  const repository = new EncryptedIndexedDbRepository(
    db,
    () => vault.cipher(),
    audit,
  );
  const wipe = async () => {
    vault.lock();
    await Promise.all([db.clear('records'), db.clear('meta'), db.clear('audit')]);
  };
  return { vault, repository, audit, wipe, close: () => db.close() };
}
