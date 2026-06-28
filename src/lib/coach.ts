/**
 * coach.ts — the in-app AI Health Coach's SAFETY LAYER (PRD Vol 2 / AI Vol 6).
 *
 * The production coach runs server-side (the `ai-coach` service); this on-device layer
 * mirrors its non-negotiable guardrails so the app stays safe even offline: it detects
 * red-flag emergencies, hard-blocks medication/insulin dosing, and otherwise gives
 * supportive, educational replies. It NEVER diagnoses or gives dosing advice.
 */
export type CoachTier = "none" | "tier2" | "tier3";

export interface CoachReply {
  text: string;
  tier: CoachTier;
  /** True when a guardrail (not a generic reply) produced this message. */
  guardrailed: boolean;
}

interface RedFlag {
  tier: CoachTier;
  triggers: string[];
  message: string;
}

const RED_FLAGS: RedFlag[] = [
  {
    tier: "tier3",
    triggers: ["can't stop vomiting", "fruity breath", "very drowsy", "ketones high", "chest pain", "can't breathe", "passing out", "seizure", "end my life", "kill myself"],
    message:
      "This could be a medical emergency. Please contact emergency services or your care team right away. I can't help with urgent medical situations.",
  },
  {
    tier: "tier2",
    triggers: ["high for days", "always high", "over 300 for"],
    message:
      "Readings that stay high are worth a prompt conversation with your care team — they may want to adjust your plan.",
  },
];

const DOSING = /(how (much|many)|what dose|increase|decrease|adjust|change|skip|double|how many units)/;
const MED = /(insulin|units|metformin|dose|medication|injection|basal|bolus)/;

const DOSING_REFUSAL =
  "I can't advise on medication or insulin doses — that has to come from your clinician, who knows your full plan. " +
  "I can help you understand how your medication works and prepare questions to ask them.";

/** Educational, non-clinical replies grounded in the app's themes. */
function educationalReply(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("exercise") || m.includes("walk"))
    return "Gentle activity like a walk after meals can help your body use glucose and eases the strain on your heart over time. Even 10 minutes counts.";
  if (m.includes("sugar") || m.includes("carb") || m.includes("diet") || m.includes("eat"))
    return "Balancing carbohydrates with protein, fibre and water tends to keep glucose steadier. Small, consistent choices add up — that's what the organ view is showing you.";
  if (m.includes("water") || m.includes("hydrat"))
    return "Staying hydrated supports your kidneys as they filter your blood. Water is a simple, high-impact habit.";
  if (m.includes("stress") || m.includes("sleep"))
    return "Stress and poor sleep can nudge glucose up. Wind-down routines and regular sleep are part of diabetes care too.";
  return "I'm here to help you understand your choices and stay motivated. For anything about your specific treatment, your care team is the right place. What would you like to learn about?";
}

/** The single safe entry point for a coach reply. */
export function localCoachReply(message: string): CoachReply {
  const text = message.toLowerCase();
  for (const tier of ["tier3", "tier2"] as const) {
    const hit = RED_FLAGS.find((r) => r.tier === tier && r.triggers.some((t) => text.includes(t)));
    if (hit) return { text: hit.message, tier: hit.tier, guardrailed: true };
  }
  if (DOSING.test(text) && MED.test(text)) return { text: DOSING_REFUSAL, tier: "none", guardrailed: true };
  return { text: educationalReply(message), tier: "none", guardrailed: false };
}
