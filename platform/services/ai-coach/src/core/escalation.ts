/**
 * escalation.ts — the escalation engine (Vol 6 §escalation).
 * Maps a guardrail tier to a concrete action and, for higher tiers, notifies the care
 * team via an injected port. Pure mapping + a thin side-effecting `escalate`.
 */
import type { EscalationTier } from "./guardrails.js";

export type EscalationAudience = "none" | "self-care" | "clinician" | "emergency";

export interface EscalationAction {
  tier: EscalationTier;
  audience: EscalationAudience;
  notifyCareTeam: boolean;
  instruction: string;
}

export function planEscalation(tier: EscalationTier): EscalationAction {
  switch (tier) {
    case "tier3":
      return { tier, audience: "emergency", notifyCareTeam: true, instruction: "Direct the user to urgent/emergency care now." };
    case "tier2":
      return { tier, audience: "clinician", notifyCareTeam: true, instruction: "Urge prompt contact with the care team." };
    case "tier1":
      return { tier, audience: "self-care", notifyCareTeam: false, instruction: "Offer gentle guidance; suggest mentioning it to the care team." };
    default:
      return { tier: "none", audience: "none", notifyCareTeam: false, instruction: "Normal educational reply." };
  }
}

/** Port: notify the care team (implemented in infra; e.g. POST to the backend). */
export interface CareTeamNotifier {
  notify(userId: string, action: EscalationAction): Promise<void>;
}

/** Execute an escalation: log/notify the care team when the action requires it. */
export async function escalate(
  notifier: CareTeamNotifier | null,
  userId: string,
  action: EscalationAction
): Promise<void> {
  if (action.notifyCareTeam && notifier) await notifier.notify(userId, action);
}
