/**
 * sync.ts — backend sync client (PRD Vol 2: migrate local-only → synced).
 *
 * Offline-first and opt-in: the app records domain events in an outbox as they happen;
 * this client drains the outbox to the platform backend (which derives XP/streak/badges
 * server-side) and pulls the authoritative progress back. Network failures are
 * non-fatal — the app keeps working locally and retries on the next sync.
 *
 * Auth: until the OIDC login flow lands, dev/demo identity is sent via x-user-* headers,
 * which the backend accepts only when no IdP is configured. Production swaps this for a
 * real bearer token.
 */
import { readingToObservations, metricObservation, type ReadingLike } from "./fhir";
import { getMetric } from "../data/metrics";

export interface MeasurementLike {
  id: string;
  metricKey: string;
  value: number;
  atMs: number;
}

export type DomainEvent =
  | { type: "action_logged"; day: number; allMarkersInRange: boolean }
  | { type: "lesson_completed"; lessonId: string; passedQuiz: boolean };

export interface OutboxItem {
  id: string; // idempotency key (backend dedupes on it)
  event: DomainEvent;
}

export interface SyncConfig {
  baseUrl: string;
  userId: string;
}

export interface ServerProgress {
  xp: number;
  streak: number;
  level: number;
}

export interface SyncResult {
  ok: boolean;
  pushed: number;
  readingsPushed: number;
  syncedIds: string[];
  serverProgress?: ServerProgress;
  error?: string;
}

export function pendingCount(outbox: readonly OutboxItem[]): number {
  return outbox.length;
}

/** Dev/demo auth headers — replaced by an OIDC bearer token in production. */
export function devAuthHeaders(userId: string): Record<string, string> {
  return { "content-type": "application/json", "x-user-id": userId, "x-user-role": "patient" };
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Push pending outbox events to the backend; returns the ids the server accepted. */
export async function pushEvents(cfg: SyncConfig, items: readonly OutboxItem[]): Promise<{ ok: boolean; syncedIds: string[]; error?: string }> {
  if (items.length === 0) return { ok: true, syncedIds: [] };
  try {
    const res = await fetch(`${normalizeBaseUrl(cfg.baseUrl)}/v1/patients/${cfg.userId}/events`, {
      method: "POST",
      headers: devAuthHeaders(cfg.userId),
      body: JSON.stringify(items),
    });
    if (!res.ok) return { ok: false, syncedIds: [], error: `server returned ${res.status}` };
    return { ok: true, syncedIds: items.map((i) => i.id) };
  } catch (e) {
    return { ok: false, syncedIds: [], error: e instanceof Error ? e.message : "network error" };
  }
}

/** Push glucose readings to the backend as FHIR Observations (idempotent). */
export async function pushReadings(cfg: SyncConfig, readings: readonly ReadingLike[]): Promise<{ pushed: number }> {
  let pushed = 0;
  for (const r of readings) {
    for (const observation of readingToObservations(r, cfg.userId)) {
      try {
        const res = await fetch(`${normalizeBaseUrl(cfg.baseUrl)}/v1/observations`, {
          method: "POST",
          headers: devAuthHeaders(cfg.userId),
          body: JSON.stringify(observation),
        });
        if (res.ok) pushed++;
      } catch {
        // non-fatal; the reading stays and retries next sync
      }
    }
  }
  return { pushed };
}

/** Push lab/body measurements (that have a LOINC code) as FHIR Observations. */
export async function pushMeasurements(cfg: SyncConfig, measurements: readonly MeasurementLike[]): Promise<{ pushed: number }> {
  let pushed = 0;
  for (const m of measurements) {
    const metric = getMetric(m.metricKey);
    if (!metric?.loinc) continue;
    try {
      const res = await fetch(`${normalizeBaseUrl(cfg.baseUrl)}/v1/observations`, {
        method: "POST",
        headers: devAuthHeaders(cfg.userId),
        body: JSON.stringify(metricObservation(cfg.userId, metric.loinc, metric.unit, m.value, m.atMs, m.id)),
      });
      if (res.ok) pushed++;
    } catch {
      // non-fatal
    }
  }
  return { pushed };
}

/** Fetch the server-derived progress for the user. */
export async function fetchProgress(cfg: SyncConfig): Promise<{ ok: boolean; progress?: ServerProgress; error?: string }> {
  try {
    const res = await fetch(`${normalizeBaseUrl(cfg.baseUrl)}/v1/patients/${cfg.userId}/progress`, {
      headers: devAuthHeaders(cfg.userId),
    });
    if (!res.ok) return { ok: false, error: `server returned ${res.status}` };
    const p = (await res.json()) as ServerProgress;
    return { ok: true, progress: p };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

/** Drain the outbox, push readings, then pull authoritative progress. */
export async function syncAll(
  cfg: SyncConfig,
  outbox: readonly OutboxItem[],
  readings: readonly ReadingLike[] = [],
  measurements: readonly MeasurementLike[] = []
): Promise<SyncResult> {
  if (!cfg.baseUrl || !cfg.userId)
    return { ok: false, pushed: 0, readingsPushed: 0, syncedIds: [], error: "sync not configured" };
  const push = await pushEvents(cfg, outbox);
  if (!push.ok) return { ok: false, pushed: 0, readingsPushed: 0, syncedIds: [], error: push.error };
  const readingResult = await pushReadings(cfg, readings);
  const measResult = await pushMeasurements(cfg, measurements);
  const prog = await fetchProgress(cfg);
  return {
    ok: prog.ok,
    pushed: push.syncedIds.length,
    readingsPushed: readingResult.pushed + measResult.pushed,
    syncedIds: push.syncedIds,
    serverProgress: prog.progress,
    error: prog.error,
  };
}
