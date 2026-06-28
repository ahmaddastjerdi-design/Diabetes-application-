/**
 * deliver.ts — the real HTTP delivery port (Vol 5 §forward, Vol 4 §ingest).
 * Uses global fetch (Node 18+). Built via tsconfig.full.json. Mirrors the behaviour
 * asserted by test-integration/forward.integration.test.mjs.
 */
import type { Observation } from "@diabetes-quest/shared";
import type { Deliver } from "../core/index.js";

export function httpDeliver(backendBaseUrl: string, token?: string): Deliver {
  return async (obs: Observation) => {
    const res = await fetch(`${backendBaseUrl}/v1/observations`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(obs),
    });
    return { ok: res.ok };
  };
}
