/**
 * healthConnect.ts — thin, defensively-guarded wrapper over Health Connect.
 *
 * Health Connect is Android-only and requires a *development build* — it is not
 * available in Expo Go or on web. The native library resolves its TurboModule
 * with `getEnforcing` at import time, which THROWS when the module isn't linked
 * (e.g. Expo Go). So we **lazy-require** it inside a try/catch rather than with a
 * top-level import: that keeps app startup safe everywhere and degrades to an
 * informative "unavailable" state instead of crashing.
 */
import { Platform } from "react-native";
import type * as HC from "react-native-health-connect";

export type HealthConnectStatus =
  | "available"
  | "unavailable"
  | "update-required"
  | "unsupported-platform"
  | "error";

let cached: typeof HC | null = null;
let loadFailed = false;

/** Lazily load the native module; returns null if it isn't usable here. */
function load(): typeof HC | null {
  if (cached) return cached;
  if (loadFailed || Platform.OS !== "android") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cached = require("react-native-health-connect") as typeof HC;
    return cached;
  } catch {
    loadFailed = true;
    return null;
  }
}

const STEPS_READ_PERMISSION = {
  accessType: "read" as const,
  recordType: "Steps" as const,
};

/** Is Health Connect installed and usable on this device? */
export async function getStatus(): Promise<HealthConnectStatus> {
  if (Platform.OS !== "android") return "unsupported-platform";
  const m = load();
  if (!m) return "unavailable";
  try {
    const status = await m.getSdkStatus();
    if (status === m.SdkAvailabilityStatus.SDK_AVAILABLE) return "available";
    if (
      status === m.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
    )
      return "update-required";
    return "unavailable";
  } catch {
    return "error";
  }
}

/** Initialise and ensure we have read permission for Steps. */
export async function ensureStepPermission(): Promise<boolean> {
  const m = load();
  if (!m) return false;
  try {
    const ok = await m.initialize();
    if (!ok) return false;

    const granted = await m.getGrantedPermissions();
    const has = granted.some(
      (p) =>
        (p as { recordType?: string }).recordType === "Steps" &&
        (p as { accessType?: string }).accessType === "read"
    );
    if (has) return true;

    const result = await m.requestPermission([STEPS_READ_PERMISSION]);
    return result.some(
      (p) => (p as { recordType?: string }).recordType === "Steps"
    );
  } catch {
    return false;
  }
}

/** Total steps recorded so far today, or null if unavailable. */
export async function getTodaySteps(): Promise<number | null> {
  const m = load();
  if (!m) return null;
  try {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const res = await m.aggregateRecord({
      recordType: "Steps",
      timeRangeFilter: {
        operator: "between",
        startTime: start.toISOString(),
        endTime: now.toISOString(),
      },
    });
    return res.COUNT_TOTAL ?? 0;
  } catch {
    return null;
  }
}
