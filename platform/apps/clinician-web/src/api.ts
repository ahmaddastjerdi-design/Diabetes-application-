/**
 * api.ts — typed client for the backend (Vol 3 ↔ Vol 4). Reads are consent-gated and
 * audited server-side (the clinician's bearer token carries their identity/role).
 * Endpoints the panel will use as the backend timeline API lands; the panel renders
 * sample data until then (see data/sample.ts).
 */
import type { GlucoseReading } from "@diabetes-quest/clinical";
import type { Observation } from "@diabetes-quest/shared";

export interface ApiConfig {
  baseUrl: string;
  token: string; // clinician OIDC access token
}

function authHeaders(cfg: ApiConfig): Record<string, string> {
  return { authorization: `Bearer ${cfg.token}`, "content-type": "application/json" };
}

/** Map a glucose FHIR Observation (mg/dL) to a clinical GlucoseReading. */
export function observationToReading(o: Observation): GlucoseReading {
  return { value: o.valueQuantity.value, atMs: Date.parse(o.effectiveDateTime) };
}

export async function getPatientProgress(cfg: ApiConfig, patientId: string): Promise<unknown> {
  const res = await fetch(`${cfg.baseUrl}/v1/patients/${patientId}/progress`, { headers: authHeaders(cfg) });
  if (res.status === 403) throw new Error("not consented to view this patient");
  if (!res.ok) throw new Error(`progress request failed: ${res.status}`);
  return res.json();
}

/** TODO(Vol 4): backend GET /v1/patients/:id/observations once the timeline API lands. */
export async function getGlucoseReadings(cfg: ApiConfig, patientId: string): Promise<GlucoseReading[]> {
  const res = await fetch(`${cfg.baseUrl}/v1/patients/${patientId}/observations?code=glucose`, {
    headers: authHeaders(cfg),
  });
  if (!res.ok) throw new Error(`observations request failed: ${res.status}`);
  const list = (await res.json()) as Observation[];
  return list.map(observationToReading);
}
