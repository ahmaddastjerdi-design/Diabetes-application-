import type { HealthRecordRepository } from '../../domain/repository';
import type {
  HealthResource,
  ResourceOf,
  ResourceType,
} from '../../domain/resources';
import type { RecordCipher } from '../crypto/recordCipher';
import type { AuditLog } from '../audit/auditLog';
import type { HpDatabase, StoredRecord } from './db';

function aadFor(resourceType: string, id: string): string {
  return `${resourceType}/${id}`;
}

/**
 * IndexedDB-backed repository with per-record AES-GCM encryption. The cipher is
 * supplied lazily by the vault so operations use the current unlocked session
 * key (and throw if the vault is locked).
 */
export class EncryptedIndexedDbRepository implements HealthRecordRepository {
  constructor(
    private readonly db: HpDatabase,
    private readonly cipher: () => RecordCipher,
    private readonly audit?: AuditLog,
  ) {}

  async put(resource: HealthResource): Promise<void> {
    const aad = aadFor(resource.resourceType, resource.id);
    const blob = await this.cipher().encrypt(aad, resource);
    const stored: StoredRecord = {
      id: resource.id,
      resourceType: resource.resourceType,
      updatedAt: resource.updatedAt,
      iv: blob.iv,
      ct: blob.ct,
    };
    await this.db.put('records', stored);
    await this.audit?.record('put', resource.resourceType, resource.id);
  }

  async get<T extends ResourceType>(
    type: T,
    id: string,
  ): Promise<ResourceOf<T> | undefined> {
    const stored = await this.db.get('records', id);
    if (!stored || stored.resourceType !== type) return undefined;
    return this.decode<ResourceOf<T>>(stored);
  }

  async list<T extends ResourceType>(type: T): Promise<ResourceOf<T>[]> {
    const stored = await this.db.getAllFromIndex('records', 'byType', type);
    const resources = await Promise.all(
      stored.map((s) => this.decode<ResourceOf<T>>(s)),
    );
    // Newest-updated first.
    return resources.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async remove(type: ResourceType, id: string): Promise<void> {
    await this.db.delete('records', id);
    await this.audit?.record('remove', type, id);
  }

  async exportAll(): Promise<HealthResource[]> {
    const stored = await this.db.getAll('records');
    const resources = await Promise.all(
      stored.map((s) => this.decode<HealthResource>(s)),
    );
    await this.audit?.record('export');
    return resources;
  }

  async clear(): Promise<void> {
    await this.db.clear('records');
    await this.audit?.record('clear');
  }

  private decode<T>(stored: StoredRecord): Promise<T> {
    const aad = aadFor(stored.resourceType, stored.id);
    return this.cipher().decrypt<T>(aad, { iv: stored.iv, ct: stored.ct });
  }
}
