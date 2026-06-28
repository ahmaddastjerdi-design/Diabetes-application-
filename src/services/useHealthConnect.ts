/**
 * useHealthConnect.ts — React hook managing Health Connect availability,
 * permission, and today's step count, with a manual refresh.
 */
import { useCallback, useEffect, useState } from "react";
import {
  HealthConnectStatus,
  getStatus,
  ensureStepPermission,
  getTodaySteps,
} from "./healthConnect";

export interface HealthConnectState {
  status: HealthConnectStatus;
  connected: boolean;
  steps: number | null;
  busy: boolean;
  /** Request permission; resolves true if connected. */
  connect: () => Promise<boolean>;
  /** Re-read today's steps (no-op if not connected). */
  refresh: () => Promise<void>;
}

export function useHealthConnect(): HealthConnectState {
  const [status, setStatus] = useState<HealthConnectStatus>(
    "unsupported-platform"
  );
  const [connected, setConnected] = useState(false);
  const [steps, setSteps] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getStatus().then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const s = await getTodaySteps();
    setSteps(s);
  }, []);

  const connect = useCallback(async () => {
    setBusy(true);
    try {
      const ok = await ensureStepPermission();
      setConnected(ok);
      if (ok) await refresh();
      return ok;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  return { status, connected, steps, busy, connect, refresh };
}
