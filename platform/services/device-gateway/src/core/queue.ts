/**
 * queue.ts — the offline ingest queue contract (Vol 5 §offline queue, aligned to Vol 4).
 *
 * Durable on-device, this is the in-memory reference implementation of the contract:
 * idempotent enqueue, FIFO drain, retry/backoff metadata. The mobile app and gateway
 * implement the same contract over persistent storage so no reading is lost or doubled.
 */
export interface QueueItem<T> {
  id: string; // idempotency key — duplicate ids are ignored
  payload: T;
  attempts: number;
  nextAttemptAfterMs: number;
}

export class OfflineQueue<T> {
  private items: QueueItem<T>[] = [];
  private seen = new Set<string>();

  /** Idempotent: enqueueing the same id twice is a no-op (returns false). */
  enqueue(id: string, payload: T): boolean {
    if (this.seen.has(id)) return false;
    this.seen.add(id);
    this.items.push({ id, payload, attempts: 0, nextAttemptAfterMs: 0 });
    return true;
  }

  /** Items due for delivery at time `nowMs`, in FIFO order. */
  due(nowMs: number): QueueItem<T>[] {
    return this.items.filter((i) => i.nextAttemptAfterMs <= nowMs);
  }

  /** Remove a successfully delivered item. */
  ack(id: string): void {
    this.items = this.items.filter((i) => i.id !== id);
  }

  /** Record a failure; exponential backoff caps at ~5 min (Vol 5 §retry). */
  fail(id: string, nowMs: number): void {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    item.attempts += 1;
    const backoff = Math.min(2 ** item.attempts * 1000, 300_000);
    item.nextAttemptAfterMs = nowMs + backoff;
  }

  get size(): number {
    return this.items.length;
  }
}
