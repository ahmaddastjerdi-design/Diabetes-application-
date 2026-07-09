import type { HealthResource, ResourceOf, ResourceType } from './resources';

/**
 * Persistence port for the health record. Features depend on this interface,
 * not on a concrete store, so the Phase-1 encrypted local implementation can be
 * joined/replaced by a syncing remote implementation in a later phase without
 * touching feature code (see ADR-0002).
 */
export interface HealthRecordRepository {
  /** Insert or replace a resource (keyed by resourceType + id). */
  put(resource: HealthResource): Promise<void>;
  /** Fetch a single resource by type and id. */
  get<T extends ResourceType>(
    type: T,
    id: string,
  ): Promise<ResourceOf<T> | undefined>;
  /** All resources of a given type, newest-updated first. */
  list<T extends ResourceType>(type: T): Promise<ResourceOf<T>[]>;
  /** Remove a resource. */
  remove(type: ResourceType, id: string): Promise<void>;
  /** Bulk read for loading the record into memory (not audited). */
  loadAll(): Promise<HealthResource[]>;
  /** Every resource, recorded as a patient-initiated export (audited). */
  exportAll(): Promise<HealthResource[]>;
  /** Irreversibly delete all records (patient right to erasure). */
  clear(): Promise<void>;
}
