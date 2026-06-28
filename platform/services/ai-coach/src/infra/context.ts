/**
 * context.ts (infra) — fetch the user's grounding data from the backend (Vol 6 ↔ Vol 4).
 * Real fetch; built via tsconfig.full.json. On failure it returns EMPTY data so the coach
 * grounds on nothing and defers to the clinician — never invents numbers.
 */
import type { ContextProvider, GroundingData } from "../core/index.js";

export function backendContextProvider(baseUrl: string, token: string): ContextProvider {
  return {
    async fetch(userId: string): Promise<GroundingData> {
      try {
        const res = await fetch(`${baseUrl}/v1/patients/${userId}/coach-context`, {
          headers: { authorization: `Bearer ${token}` },
        });
        if (!res.ok) return { recentMarkers: [], lessonsCompleted: [] };
        return (await res.json()) as GroundingData;
      } catch {
        return { recentMarkers: [], lessonsCompleted: [] };
      }
    },
  };
}
