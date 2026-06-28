/**
 * context.ts — grounding the coach in the user's OWN data (Vol 6 §grounding).
 *
 * The coach must never invent clinical numbers. It may only reference data fetched here
 * and the vetted lessons. `buildGroundingContext` turns retrieved data into the
 * `CoachContext` the orchestrator passes to the model; the model is instructed to rely
 * on it and to defer to the clinician when data is missing.
 */
import type { CoachContext } from "./provider.js";

export interface RecentMarker {
  label: string;
  value: number;
  unit: string;
  status: "in-range" | "borderline" | "out-of-range";
}

export interface GroundingData {
  recentMarkers: RecentMarker[];
  organTrends?: string;
  lessonsCompleted: string[];
}

export function buildGroundingContext(data: GroundingData): CoachContext {
  const markerText = data.recentMarkers
    .map((m) => `${m.label} ${m.value}${m.unit} (${m.status})`)
    .join(", ");
  const recentSummary = [markerText, data.organTrends].filter(Boolean).join("; ") || undefined;
  return { recentSummary, lessons: data.lessonsCompleted };
}

/** Port: fetch a user's grounding data (implemented against the backend in infra). */
export interface ContextProvider {
  fetch(userId: string): Promise<GroundingData>;
}
