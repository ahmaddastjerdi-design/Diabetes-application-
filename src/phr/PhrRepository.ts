/**
 * PhrRepository.ts — the persistence layer for Personal Health Records.
 *
 * A thin, framework-agnostic repository over the patient's PHR entries. It owns
 * its own storage key (separate from the game state in `GameContext`) and a
 * versioned envelope so the on-disk format can migrate independently.
 *
 * The backing store is injectable (`PhrStorage`) — it defaults to
 * AsyncStorage on-device but a plain in-memory object satisfies the same shape,
 * which keeps the repository unit-testable without native mocks.
 *
 * All reads are corruption-tolerant: a missing or unparceable blob resolves to
 * an empty record rather than throwing, mirroring `GameContext`'s load path.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  PhrEntry,
  PhrKind,
  PhrEntryOf,
  addEntry,
  removeEntry,
  updateEntry,
  entriesOfKind,
  latestOfKind,
} from "./records";

/** The subset of the AsyncStorage API the repository needs. */
export interface PhrStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Versioned on-disk envelope. */
interface PhrEnvelope {
  version: number;
  entries: PhrEntry[];
}

export const PHR_STORAGE_KEY = "diabetes-quest/phr/v1";
const PHR_VERSION = 1;

export class PhrRepository {
  constructor(
    private readonly storage: PhrStorage = AsyncStorage,
    private readonly key: string = PHR_STORAGE_KEY
  ) {}

  /** Read every entry. Returns `[]` on a missing or corrupt store. */
  async all(): Promise<PhrEntry[]> {
    try {
      const raw = await this.storage.getItem(this.key);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Partial<PhrEnvelope>;
      return Array.isArray(parsed.entries) ? parsed.entries : [];
    } catch {
      return []; // start fresh on any corruption
    }
  }

  /** Overwrite the whole record. Returns the entries it persisted. */
  async replaceAll(entries: PhrEntry[]): Promise<PhrEntry[]> {
    const envelope: PhrEnvelope = { version: PHR_VERSION, entries };
    await this.storage.setItem(this.key, JSON.stringify(envelope));
    return entries;
  }

  /** Add an entry and persist. Returns the full, updated list. */
  async add(entry: PhrEntry): Promise<PhrEntry[]> {
    return this.replaceAll(addEntry(await this.all(), entry));
  }

  /** Remove an entry by id and persist. Returns the full, updated list. */
  async remove(id: string): Promise<PhrEntry[]> {
    return this.replaceAll(removeEntry(await this.all(), id));
  }

  /** Shallow-merge a patch into one entry and persist. Returns the updated list. */
  async update(id: string, patch: Partial<PhrEntry>): Promise<PhrEntry[]> {
    return this.replaceAll(updateEntry(await this.all(), id, patch));
  }

  /** All entries of a kind, most-recent first. */
  async ofKind<K extends PhrKind>(kind: K): Promise<PhrEntryOf<K>[]> {
    return entriesOfKind(await this.all(), kind);
  }

  /** The most recent entry of a kind, or `undefined`. */
  async latest<K extends PhrKind>(
    kind: K
  ): Promise<PhrEntryOf<K> | undefined> {
    return latestOfKind(await this.all(), kind);
  }

  /** Delete the entire record. */
  async clear(): Promise<void> {
    await this.storage.removeItem(this.key);
  }
}

/** Shared default instance backed by on-device AsyncStorage. */
export const phrRepository = new PhrRepository();
