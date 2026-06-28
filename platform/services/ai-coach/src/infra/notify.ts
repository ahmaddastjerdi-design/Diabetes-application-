/**
 * notify.ts (infra) — care-team escalation notifier (Vol 6 §escalation ↔ Vol 4).
 * POSTs an escalation to the backend, which records it (audited) and alerts the care
 * team. Built via tsconfig.full.json.
 */
import type { CareTeamNotifier, EscalationAction } from "../core/index.js";

export function backendNotifier(baseUrl: string, token: string): CareTeamNotifier {
  return {
    async notify(userId: string, action: EscalationAction): Promise<void> {
      await fetch(`${baseUrl}/v1/escalations`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, ...action }),
      });
    },
  };
}
