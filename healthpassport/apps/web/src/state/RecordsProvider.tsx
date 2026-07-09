import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRepository } from './SessionProvider';
import type {
  HealthResource,
  Patient,
  ResourceOf,
  ResourceType,
} from '../domain/resources';

/** The record owner is a single Patient resource with a stable id. */
export const SELF_PATIENT_ID = 'patient-self';

interface RecordsContextValue {
  loading: boolean;
  resources: HealthResource[];
  byType: <T extends ResourceType>(type: T) => ResourceOf<T>[];
  patient: Patient | undefined;
  save: (resource: HealthResource) => Promise<void>;
  remove: (type: ResourceType, id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const repository = useRepository();
  const [resources, setResources] = useState<HealthResource[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const all = await repository.loadAll();
    all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setResources(all);
    setLoading(false);
  }, [repository]);

  useEffect(() => {
    let active = true;
    repository
      .loadAll()
      .then((all) => {
        if (!active) return;
        all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        setResources(all);
        setLoading(false);
      })
      // Swallow teardown-time rejections (e.g. the store closed on unmount).
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [repository]);

  const save = useCallback(
    async (resource: HealthResource) => {
      await repository.put(resource);
      setResources((prev) => {
        const next = prev.filter((r) => r.id !== resource.id);
        next.push(resource);
        next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        return next;
      });
    },
    [repository],
  );

  const remove = useCallback(
    async (type: ResourceType, id: string) => {
      await repository.remove(type, id);
      setResources((prev) => prev.filter((r) => r.id !== id));
    },
    [repository],
  );

  const byType = useCallback(
    <T extends ResourceType>(type: T): ResourceOf<T>[] =>
      resources.filter((r): r is ResourceOf<T> => r.resourceType === type),
    [resources],
  );

  const patient = useMemo(
    () => resources.find((r): r is Patient => r.resourceType === 'Patient'),
    [resources],
  );

  const value = useMemo<RecordsContextValue>(
    () => ({ loading, resources, byType, patient, save, remove, reload }),
    [loading, resources, byType, patient, save, remove, reload],
  );

  return (
    <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>
  );
}

export function useRecords(): RecordsContextValue {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within <RecordsProvider>');
  return ctx;
}
