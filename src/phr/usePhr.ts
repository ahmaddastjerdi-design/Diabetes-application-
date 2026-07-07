/**
 * usePhr.ts — React hook exposing the patient's Personal Health Record.
 *
 * Wraps a `PhrRepository` (AsyncStorage-backed by default) with the same
 * load-once-then-mutate shape the rest of the app uses (cf. `useHealthConnect`).
 * Mutations write through the repository and refresh in-memory state so screens
 * always render what is persisted.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PhrEntry, PhrKind, PhrEntryOf, entriesOfKind } from "./records";
import { PhrRepository, phrRepository } from "./PhrRepository";

export interface PhrState {
  /** All entries, most-recent first. Empty until `ready`. */
  entries: PhrEntry[];
  /** True once the initial load from storage has completed. */
  ready: boolean;
  /** Persist a new entry, then refresh. */
  add: (entry: PhrEntry) => Promise<void>;
  /** Remove an entry by id, then refresh. */
  remove: (id: string) => Promise<void>;
  /** Shallow-merge a patch into one entry, then refresh. */
  update: (id: string, patch: Partial<PhrEntry>) => Promise<void>;
  /** Wipe the whole record, then refresh. */
  clear: () => Promise<void>;
  /** Filter the loaded entries to one kind (memoised, no I/O). */
  ofKind: <K extends PhrKind>(kind: K) => PhrEntryOf<K>[];
}

/**
 * @param repo Optional repository (defaults to the shared AsyncStorage-backed
 * instance); pass a custom one in tests or to target a different store.
 */
export function usePhr(repo: PhrRepository = phrRepository): PhrState {
  const [entries, setEntries] = useState<PhrEntry[]>([]);
  const [ready, setReady] = useState(false);
  const repoRef = useRef(repo);
  repoRef.current = repo;

  useEffect(() => {
    let alive = true;
    repoRef.current.all().then((list) => {
      if (alive) {
        setEntries(list);
        setReady(true);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const add = useCallback(async (entry: PhrEntry) => {
    setEntries(await repoRef.current.add(entry));
  }, []);

  const remove = useCallback(async (id: string) => {
    setEntries(await repoRef.current.remove(id));
  }, []);

  const update = useCallback(async (id: string, patch: Partial<PhrEntry>) => {
    setEntries(await repoRef.current.update(id, patch));
  }, []);

  const clear = useCallback(async () => {
    await repoRef.current.clear();
    setEntries([]);
  }, []);

  const ofKind = useCallback(
    <K extends PhrKind>(kind: K) => entriesOfKind(entries, kind),
    [entries]
  );

  return useMemo(
    () => ({ entries, ready, add, remove, update, clear, ofKind }),
    [entries, ready, add, remove, update, clear, ofKind]
  );
}
