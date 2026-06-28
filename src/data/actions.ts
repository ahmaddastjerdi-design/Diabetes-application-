/**
 * actions.ts — the catalog of things a patient can log each day.
 *
 * Each action carries immediate effects on physiological markers, plus a short
 * `teach` line explaining the mechanism. Effect magnitudes are illustrative and
 * tuned for clear, learnable feedback — not clinical precision.
 */
import { MarkerKey, MARKERS } from "../engine/physiology";

export type ActionCategory = "diet" | "exercise" | "drug";

export interface ActionDef {
  id: string;
  category: ActionCategory;
  label: string;
  emoji: string;
  /** Immediate change applied to markers when logged. */
  effects: Partial<Record<MarkerKey, number>>;
  /** One-line mechanism shown as feedback ("why did that happen?"). */
  teach: string;
}

export const ACTIONS: ActionDef[] = [
  // ---- Diet ----
  {
    id: "sugary-drink",
    category: "diet",
    label: "Sugary drink",
    emoji: "🥤",
    effects: { glucose: +55 },
    teach: "Fast sugar spikes blood glucose — hard on kidneys and vessels.",
  },
  {
    id: "balanced-meal",
    category: "diet",
    label: "Balanced plate",
    emoji: "🥗",
    effects: { glucose: +20, ldl: -2 },
    teach: "Fiber + protein slow sugar absorption, so glucose rises gently.",
  },
  {
    id: "salty-meal",
    category: "diet",
    label: "Salty / fast food",
    emoji: "🍟",
    effects: { systolic: +14, ldl: +6, glucose: +20 },
    teach: "Excess sodium raises blood pressure; fat raises LDL cholesterol.",
  },
  {
    id: "water",
    category: "diet",
    label: "Glass of water",
    emoji: "💧",
    effects: { hydration: +18 },
    teach: "Staying hydrated helps your kidneys filter waste efficiently.",
  },
  {
    id: "oily-fish",
    category: "diet",
    label: "Fish / healthy fats",
    emoji: "🐟",
    effects: { ldl: -8, glucose: +10 },
    teach: "Omega-3 fats help lower LDL cholesterol, protecting the heart.",
  },

  // ---- Exercise ----
  {
    id: "walk",
    category: "exercise",
    label: "30-min walk",
    emoji: "🚶",
    effects: { glucose: -22, systolic: -8 },
    teach: "Muscles burn glucose during activity, lowering blood sugar.",
  },
  {
    id: "strength",
    category: "exercise",
    label: "Strength training",
    emoji: "🏋️",
    effects: { glucose: -16, systolic: -4, ldl: -3 },
    teach: "Building muscle improves how your body uses insulin all day.",
  },
  {
    id: "rest-day",
    category: "exercise",
    label: "Sedentary day",
    emoji: "🛋️",
    effects: { glucose: +8, systolic: +3 },
    teach: "Long inactivity lets glucose and blood pressure creep up.",
  },

  // ---- Drugs / medication ----
  {
    id: "metformin",
    category: "drug",
    label: "Took metformin",
    emoji: "💊",
    effects: { glucose: -30 },
    teach: "Metformin lowers the glucose your liver releases.",
  },
  {
    id: "insulin",
    category: "drug",
    label: "Took insulin",
    emoji: "💉",
    effects: { glucose: -40 },
    teach: "Insulin moves glucose out of your blood into your cells.",
  },
  {
    id: "bp-med",
    category: "drug",
    label: "Took BP medicine",
    emoji: "🩺",
    effects: { systolic: -18 },
    teach: "Blood-pressure medicine relaxes vessels, easing heart & kidney load.",
  },
  {
    id: "statin",
    category: "drug",
    label: "Took statin",
    emoji: "🧪",
    effects: { ldl: -18 },
    teach: "Statins reduce LDL cholesterol your body makes.",
  },
  {
    id: "missed-meds",
    category: "drug",
    label: "Missed my medicine",
    emoji: "⏭️",
    effects: { glucose: +22, systolic: +8 },
    teach: "Skipping doses lets glucose and pressure rebound — adherence matters.",
  },
];

export const ACTIONS_BY_CATEGORY: Record<ActionCategory, ActionDef[]> = {
  diet: ACTIONS.filter((a) => a.category === "diet"),
  exercise: ACTIONS.filter((a) => a.category === "exercise"),
  drug: ACTIONS.filter((a) => a.category === "drug"),
};

export const CATEGORY_META: Record<
  ActionCategory,
  { label: string; emoji: string }
> = {
  diet: { label: "Diet", emoji: "🍽️" },
  exercise: { label: "Exercise", emoji: "🏃" },
  drug: { label: "Medication", emoji: "💊" },
};

export function getAction(id: string): ActionDef | undefined {
  return ACTIONS.find((a) => a.id === id);
}

/**
 * Build an action from a real measured reading (e.g. a glucometer or BP cuff).
 * The day starts from baseline, so we set the effect so the marker lands exactly
 * on the measured `value`, then the day is scored on that real number.
 */
export function readingToAction(marker: MarkerKey, value: number): ActionDef {
  const def = MARKERS[marker];
  const labels: Partial<Record<MarkerKey, { label: string; emoji: string }>> = {
    glucose: { label: "Blood sugar", emoji: "🩸" },
    systolic: { label: "Blood pressure", emoji: "🩺" },
  };
  const meta = labels[marker] ?? { label: def.label, emoji: "📋" };
  return {
    id: `reading-${marker}`,
    category: "drug", // internal: entered via the readings UI, not the tile grid
    label: `${meta.label}: ${value}`,
    emoji: meta.emoji,
    effects: { [marker]: value - def.baseline },
    teach: `You logged your ${def.label.toLowerCase()} at ${value} ${def.unit}.`,
  };
}

/**
 * Build a synthetic action from a real Health Connect step count. More steps =
 * a bigger glucose/blood-pressure benefit, capped so a single day can't swing
 * the model unrealistically (mirrors a brisk walk at the high end).
 */
export function stepsToAction(steps: number): ActionDef {
  const glucose = -Math.min(35, Math.round(steps / 180));
  const systolic = -Math.min(12, Math.round(steps / 600));
  return {
    id: "health-steps",
    category: "exercise",
    label: `${steps.toLocaleString()} steps today`,
    emoji: "👟",
    effects: { glucose, systolic },
    teach:
      "Real steps from Health Connect — movement burns glucose and eases blood pressure.",
  };
}
