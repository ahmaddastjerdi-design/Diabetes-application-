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
    id: "insulin",
    actionId: "insulin",
    label: "Insulin",
    emoji: "💉",
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

/** Preset reminder times (24h), so we avoid a date-picker dependency. */
export const REMINDER_TIMES: { label: string; hour: number }[] = [
  { label: "Morning · 8:00", hour: 8 },
  { label: "Midday · 13:00", hour: 13 },
  { label: "Evening · 20:00", hour: 20 },
];

export interface UserProfile {
  name: string;
  condition: ConditionId;
  /** Selected medication ids (subset of MEDICATIONS ids / ActionDef ids). */
  medications: string[];
  stepGoal: number;
  onboarded: boolean;
  /** Whether the one-time "how it works" walkthrough has been seen. */
  tutorialSeen: boolean;
  /** Daily medication reminder. */
  reminderEnabled: boolean;
  reminderHour: number;
}

export function defaultProfile(): UserProfile {
  return {
    name: "",
    condition: "type2",
    medications: [],
    stepGoal: 6000,
    onboarded: false,
    tutorialSeen: false,
    reminderEnabled: false,
    reminderHour: 20,
  };
}

/** Builds the reminder body, naming the patient's meds when known. */
export function reminderBody(medications: string[]): string {
  const names = MEDICATIONS.filter((m) => medications.includes(m.id)).map(
    (m) => m.label
  );
  if (names.length === 0) return "Time to take your medication.";
  if (names.length === 1) return `Time to take your ${names[0]}.`;
  const last = names.pop();
  return `Time to take your ${names.join(", ")} and ${last}.`;
}
