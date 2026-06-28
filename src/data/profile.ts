/**
 * profile.ts — personalization options collected during onboarding.
 *
 * Personalization was one of the clearest differentiators in the app-review
 * literature: condition type, the patient's own medications, and a self-chosen
 * activity goal (autonomy, per Self-Determination Theory).
 */

export type ConditionId = "type2" | "type1" | "prediabetes" | "ckd";

export interface ConditionDef {
  id: ConditionId;
  label: string;
  emoji: string;
  blurb: string;
}

export const CONDITIONS: ConditionDef[] = [
  {
    id: "type2",
    label: "Type 2 diabetes",
    emoji: "🩸",
    blurb: "Managed with lifestyle and often tablets like metformin.",
  },
  {
    id: "type1",
    label: "Type 1 diabetes",
    emoji: "💉",
    blurb: "Insulin-dependent; carb and dosing balance is key.",
  },
  {
    id: "prediabetes",
    label: "Prediabetes",
    emoji: "⚠️",
    blurb: "A chance to turn things around with diet and activity.",
  },
  {
    id: "ckd",
    label: "Kidney disease (CKD)",
    emoji: "🫘",
    blurb: "Protecting kidney function with diet, fluids and BP control.",
  },
];

export function getCondition(id: ConditionId): ConditionDef {
  return CONDITIONS.find((c) => c.id === id) ?? CONDITIONS[0];
}

/** A medication the patient may be on. `actionId` links to an ActionDef. */
export interface MedicationOption {
  id: string;
  actionId: string;
  label: string;
  emoji: string;
  controls: string;
}

export const MEDICATIONS: MedicationOption[] = [
  {
    id: "metformin",
    actionId: "metformin",
    label: "Metformin",
    emoji: "💊",
    controls: "blood glucose",
  },
  {
    id: "bp-med",
    actionId: "bp-med",
    label: "Blood-pressure pill",
    emoji: "🩺",
    controls: "blood pressure",
  },
  {
    id: "statin",
    actionId: "statin",
    label: "Statin",
    emoji: "🧪",
    controls: "cholesterol",
  },
];

export const STEP_GOAL_OPTIONS = [4000, 6000, 8000, 10000];

export interface UserProfile {
  name: string;
  condition: ConditionId;
  /** Selected medication ids (subset of MEDICATIONS ids / ActionDef ids). */
  medications: string[];
  stepGoal: number;
  onboarded: boolean;
}

export function defaultProfile(): UserProfile {
  return {
    name: "",
    condition: "type2",
    medications: [],
    stepGoal: 6000,
    onboarded: false,
  };
}
