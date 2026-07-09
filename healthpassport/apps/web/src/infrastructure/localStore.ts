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
  return { vault, repository, audit };
}
