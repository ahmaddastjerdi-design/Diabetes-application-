/**
 * worker.ts — the forward-to-backend drain loop (Vol 5 §sync, Vol 4 §ingest).
 *
 * Pure orchestration over the OfflineQueue: it depends on an injected `Deliver` port,
 * so the retry/backoff/ack logic is testable with a fake delivery and the real HTTP
 * delivery (src/infra/deliver.ts) is a drop-in. ack on success, fail (→ backoff) otherwise.
 */
import type { Observation } from "@diabetes-quest/shared";
import type { OfflineQueue } from "./queue.js";

export interface DeliveryResult {
  ok: boolean;
}

export type Deliver = (obs: Observation) => Promise<DeliveryResult>;

export interface DrainSummary {
  delivered: number;
  failed: number;
}

/** Drain everything due at `now`, forwarding each to the backend exactly once. */
export async function drainOnce(
  queue: OfflineQueue<Observation>,
  deliver: Deliver,
  now: number
): Promise<DrainSummary> {
  let delivered = 0;
  let failed = 0;
  for (const item of queue.due(now)) {
    try {
      const res = await deliver(item.payload);
      if (res.ok) {
        queue.ack(item.id);
        delivered++;
      } else {
        queue.fail(item.id, now);
        failed++;
      }
    } catch {
      queue.fail(item.id, now); // transient error → backoff and retry next tick
      failed++;
    }
  }
  return { delivered, failed };
}
