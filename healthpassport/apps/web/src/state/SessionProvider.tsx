import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createLocalHealthStore,
  type LocalHealthStore,
} from '../infrastructure/localStore';
import type { HealthRecordRepository } from '../domain/repository';

export type SessionStatus =
  | 'loading'
  | 'uninitialized'
  | 'locked'
  | 'unlocked'
  | 'error';

interface SessionContextValue {
  status: SessionStatus;
  repository: HealthRecordRepository | null;
  initialize: (passphrase: string) => Promise<void>;
  unlock: (passphrase: string) => Promise<void>;
  lock: () => void;
  eraseEverything: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Auto-lock after this much inactivity, clearing the key from memory. */
const IDLE_LOCK_MS = 10 * 60 * 1000;

export function SessionProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<LocalHealthStore | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storeRef = useRef<LocalHealthStore | null>(null);

  // Open the local store once and determine first-run vs. returning user.
  useEffect(() => {
    let active = true;
    createLocalHealthStore()
      .then(async (s) => {
        storeRef.current = s;
        if (!active) {
          s.close();
          return;
        }
        setStore(s);
        setStatus((await s.vault.isInitialized()) ? 'locked' : 'uninitialized');
      })
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
      storeRef.current?.close();
      storeRef.current = null;
    };
  }, []);

  const lock = useCallback(() => {
    store?.vault.lock();
    setStatus((prev) => (prev === 'unlocked' ? 'locked' : prev));
  }, [store]);

  // Idle auto-lock while unlocked.
  useEffect(() => {
    if (status !== 'unlocked') return;
    const reset = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(lock, IDLE_LOCK_MS);
    };
    const events = ['pointerdown', 'keydown', 'visibilitychange'] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [status, lock]);

  const initialize = useCallback(
    async (passphrase: string) => {
      if (!store) throw new Error('Store not ready.');
      await store.vault.initialize(passphrase);
      setStatus('unlocked');
    },
    [store],
  );

  const unlock = useCallback(
    async (passphrase: string) => {
      if (!store) throw new Error('Store not ready.');
      await store.vault.unlock(passphrase);
      await store.audit.record('unlock');
      setStatus('unlocked');
    },
    [store],
  );

  const eraseEverything = useCallback(async () => {
    if (!store) return;
    await store.wipe();
    setStatus('uninitialized');
  }, [store]);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      repository: status === 'unlocked' ? (store?.repository ?? null) : null,
      initialize,
      unlock,
      lock,
      eraseEverything,
    }),
    [status, store, initialize, unlock, lock, eraseEverything],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within <SessionProvider>');
  return ctx;
}

/** Repository accessor for feature code; throws if used while locked. */
export function useRepository(): HealthRecordRepository {
  const { repository } = useSession();
  if (!repository) throw new Error('Record is locked.');
  return repository;
}
