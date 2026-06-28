/**
 * guardrails.ts — the safety core of the AI Health Coach (Vol 6).
 *
 * SAFETY IS THE PRODUCT. These pure functions run BEFORE and AFTER any model call:
 *  - input classification detects red-flags and mandates an escalation response;
 *  - a hard block prevents the coach from ever giving medication/insulin dosing.
 * They are pure and deterministic so the safety eval suite (Vol 9) can assert on them.
 */

export type EscalationTier =
  | "none" // ordinary educational/motivational chat
  | "tier1" // gentle clinical nudge ("worth mentioning to your care team")
  | "tier2" // urge prompt contact with clinician
  | "tier3"; // emergency — direct to urgent/emergency care, notify care team

export interface RedFlagRule {
  id: string;
  tier: EscalationTier;
  /** Lowercased substrings that trip this rule (illustrative; real system uses a
   *  classifier — see Vol 6 §guardrails — this keyword layer is the deterministic floor). */
  triggers: string[];
  message: string;
}

/** Tier-3 emergencies must be caught with very high recall (Vol 6 eval: >=99%). */
export const RED_FLAG_RULES: readonly RedFlagRule[] = [
  {
    id: "dka",
    tier: "tier3",
    triggers: ["can't stop vomiting", "fruity breath", "trouble breathing", "very drowsy", "ketones high"],
    message:
      "These can be signs of a serious diabetes emergency (DKA). Please seek urgent medical care or call your local emergency number now.",
  },
  {
    id: "severe-hypo",
    tier: "tier3",
    triggers: ["passing out", "can't see", "seizure", "confused and shaking", "blood sugar 40", "sugar is 38"],
    message:
      "Very low blood sugar can be dangerous. If you can, take fast-acting sugar now, and contact emergency services or someone nearby immediately.",
  },
  {
    id: "chest-pain",
    tier: "tier3",
    triggers: ["chest pain", "pain in my arm and jaw", "can't breathe"],
    message: "Chest pain can be an emergency. Please call your local emergency number now.",
  },
  {
    id: "self-harm",
    tier: "tier3",
    triggers: ["want to end my life", "kill myself", "suicidal"],
    message:
      "I'm really sorry you're feeling this way. You deserve support right now — please contact a local crisis line or emergency services. You are not alone.",
  },
  {
    id: "persistent-hyper",
    tier: "tier2",
    triggers: ["over 300 for", "always high", "high for days"],
    message:
      "Persistently high readings are worth a prompt conversation with your care team — they may want to adjust your plan.",
  },
];

export interface Classification {
  tier: EscalationTier;
  ruleId: string | null;
  mandatedMessage: string | null;
}

/** Classify a user message to the HIGHEST-severity matching rule. */
export function classifyMessage(text: string): Classification {
  const t = text.toLowerCase();
  const order: EscalationTier[] = ["tier3", "tier2", "tier1"];
  for (const tier of order) {
    const hit = RED_FLAG_RULES.find((r) => r.tier === tier && r.triggers.some((k) => t.includes(k)));
    if (hit) return { tier: hit.tier, ruleId: hit.id, mandatedMessage: hit.message };
  }
  return { tier: "none", ruleId: null, mandatedMessage: null };
}

/**
 * Hard block: the coach must NEVER tell a user how much insulin/medication to take
 * or to change a dose. Detects dosing-style intent so the orchestrator can refuse
 * and redirect to the clinician (Vol 6 §dosing hard block).
 */
export function isDosingRequest(text: string): boolean {
  const t = text.toLowerCase();
  const dose = /(how (much|many)|what dose|increase|decrease|adjust|change|skip|double|how many units)/;
  const med = /(insulin|units|metformin|dose|medication|injection|basal|bolus)/;
  return dose.test(t) && med.test(t);
}

export const DOSING_REFUSAL =
  "I can't advise on medication or insulin doses — that has to come from your clinician, who knows your full plan. " +
  "I can help you understand how your medication works and prepare questions to ask them.";
