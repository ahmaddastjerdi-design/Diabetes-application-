/**
 * trends.ts — time-bucketing for charts (hourly / daily / weekly / monthly).
 * Pure: turns a list of timestamped readings into fixed, ordered buckets with the
 * average value per bucket, ready to draw as bars. Verified by the engine smoke check.
 */
export type Granularity = "hourly" | "daily" | "weekly" | "monthly";

export interface SeriesPoint {
  atMs: number;
  value: number;
}

export interface Bucket {
  label: string;
  /** Average of readings in the bucket, or null when the bucket is empty. */
  value: number | null;
  count: number;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

interface GranConfig {
  buckets: number;
  size: number;
  label: (start: number, indexFromOldest: number, total: number) => string;
}

const CONFIG: Record<Granularity, GranConfig> = {
  hourly: { buckets: 24, size: HOUR, label: (s) => `${new Date(s).getHours()}` },
  daily: { buckets: 14, size: DAY, label: (s) => `${new Date(s).getDate()}/${new Date(s).getMonth() + 1}` },
  weekly: { buckets: 8, size: 7 * DAY, label: (_s, i, n) => `${n - i}w` },
  monthly: { buckets: 12, size: 30 * DAY, label: (s) => `${new Date(s).getMonth() + 1}` },
};

/**
 * Bucket points into the most recent N windows ending at `now`, oldest first.
 * Each bucket holds the average of the readings whose timestamp falls in its window.
 */
export function bucketSeries(points: readonly SeriesPoint[], gran: Granularity, now: number): Bucket[] {
  const { buckets, size, label } = CONFIG[gran];
  const windowStart = now - buckets * size;
  const sums = new Array<number>(buckets).fill(0);
  const counts = new Array<number>(buckets).fill(0);

  for (const p of points) {
    if (p.atMs < windowStart || p.atMs > now) continue;
    let idx = Math.floor((p.atMs - windowStart) / size);
    if (idx < 0) idx = 0;
    if (idx >= buckets) idx = buckets - 1;
    sums[idx] += p.value;
    counts[idx] += 1;
  }

  const out: Bucket[] = [];
  for (let i = 0; i < buckets; i++) {
    const start = windowStart + i * size;
    const c = counts[i]!;
    out.push({ label: label(start, i, buckets), value: c > 0 ? Math.round(sums[i]! / c) : null, count: c });
  }
  return out;
}

/** Min/max across non-empty buckets (for the chart's y-axis), with a sensible fallback. */
export function seriesRange(buckets: readonly Bucket[], fallback: [number, number]): [number, number] {
  const vals = buckets.map((b) => b.value).filter((v): v is number => v !== null);
  if (vals.length === 0) return fallback;
  return [Math.min(...vals, fallback[0]), Math.max(...vals, fallback[1])];
}
