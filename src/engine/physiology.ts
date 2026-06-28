/**
 * physiology.ts — the "organ-impact" simulation engine.
 *
 * This is an INTENTIONALLY SIMPLIFIED, ILLUSTRATIVE model. It is designed to
 * teach the *direction* of cause-and-effect relationships (e.g. "high sodium
 * raises blood pressure, which strains the heart and kidneys") in a way that is
 * directionally faithful to clinical understanding. It is NOT a clinical
 * predictor and must never be presented as medical advice.
 *
 * Design follows the MDA framework (Mechanics -> Dynamics -> Aesthetics):
 *   Mechanic : the patient logs daily Actions (diet / exercise / drug).
 *   Dynamic  : actions move physiological Markers; markers in/out of healthy
 *              range slowly heal or damage Organs over time.
 *   Aesthetic: the patient *sees* their heart and kidneys respond, building an
 *              intuitive, embodied understanding of their choices.
 */

export type MarkerKey = "glucose" | "systolic" | "hydration" | "ldl";
export type OrganKey = "heart" | "kidney";

/** A physiological marker with a healthy target band. */
export interface MarkerDef {
  key: MarkerKey;
  label: string;
  unit: string;
  /** Healthy range [low, high]. Staying inside heals organs; outside harms. */
  healthy: [number, number];
  /** Hard clamp so values stay plausible. */
  clamp: [number, number];
  /**
   * The untreated daily starting point. Each new day the marker resets here and
   * the day's logged actions move it from there, so end-of-day values reflect
   * the choices just made (no unbounded accumulation across days). Baselines sit
   * slightly OUTSIDE the healthy band, so doing nothing drifts you down and good
   * daily choices are what bring you into range.
   */
  baseline: number;
}

export const MARKERS: Record<MarkerKey, MarkerDef> = {
  glucose: {
    key: "glucose",
    label: "Blood glucose",
    unit: "mg/dL",
    healthy: [80, 140],
    clamp: [60, 320],
    baseline: 150,
  },
  systolic: {
    key: "systolic",
    label: "Blood pressure",
    unit: "mmHg",
    healthy: [100, 130],
    clamp: [85, 200],
    baseline: 135,
  },
  hydration: {
    key: "hydration",
    label: "Hydration",
    unit: "%",
    healthy: [60, 100],
    clamp: [10, 100],
    baseline: 55,
  },
  ldl: {
    key: "ldl",
    label: "LDL cholesterol",
    unit: "mg/dL",
    healthy: [40, 100],
    clamp: [40, 240],
    baseline: 108,
  },
};

export interface OrganDef {
  key: OrganKey;
  label: string;
  emoji: string;
  blurb: string;
  /**
   * How strongly each marker being OUT of its healthy band damages this organ.
   * Higher weight = this organ is more sensitive to that marker.
   */
  sensitivity: Partial<Record<MarkerKey, number>>;
}

export const ORGANS: Record<OrganKey, OrganDef> = {
  heart: {
    key: "heart",
    label: "Heart",
    emoji: "❤️",
    blurb:
      "High blood pressure, high glucose and high LDL cholesterol force the heart to work harder and damage blood vessels over time.",
    sensitivity: { systolic: 1.0, ldl: 0.8, glucose: 0.5 },
  },
  kidney: {
    key: "kidney",
    label: "Kidneys",
    emoji: "🫘",
    blurb:
      "Kidneys filter your blood. Persistently high glucose and blood pressure, plus dehydration, slowly reduce their filtering ability.",
    sensitivity: { glucose: 1.0, systolic: 0.9, hydration: 0.6 },
  },
};

/** The full simulated body state. Persisted between sessions. */
export interface BodyState {
  markers: Record<MarkerKey, number>;
  /** Organ health 0 (failing) .. 100 (excellent). */
  organs: Record<OrganKey, number>;
  /** Day index since the patient started. */
  day: number;
}

export function initialBodyState(): BodyState {
  return {
    markers: {
      glucose: MARKERS.glucose.baseline,
      systolic: MARKERS.systolic.baseline,
      hydration: MARKERS.hydration.baseline,
      ldl: MARKERS.ldl.baseline,
    },
    organs: { heart: 70, kidney: 70 },
    day: 0,
  };
}

/** Apply a single action's immediate marker effects to a copy of the state. */
export function applyActionEffects(
  state: BodyState,
  effects: Partial<Record<MarkerKey, number>>
): BodyState {
  const markers = { ...state.markers };
  for (const k of Object.keys(effects) as MarkerKey[]) {
    const def = MARKERS[k];
    markers[k] = clamp(markers[k] + (effects[k] ?? 0), def.clamp);
  }
  return { ...state, markers };
}

/**
 * How far a marker is outside its healthy band, normalised roughly to 0..1+.
 * 0 = comfortably inside the band. Used to drive organ damage.
 */
export function deviation(key: MarkerKey, value: number): number {
  const { healthy, clamp: cl } = MARKERS[key];
  const [lo, hi] = healthy;
  if (value >= lo && value <= hi) return 0;
  const span = cl[1] - cl[0];
  const out = value < lo ? lo - value : value - hi;
  return out / span;
}

/**
 * Advance one simulated day:
 *  1. Each organ heals if the day's markers stayed healthy, else takes damage.
 *  2. Markers reset to baseline for the next day (the day's choices have been
 *     "scored"; tomorrow is a fresh start the patient again acts upon).
 * Returns the new state plus a per-organ delta for UI feedback.
 */
export function advanceDay(state: BodyState): {
  next: BodyState;
  organDelta: Record<OrganKey, number>;
} {
  // 1. Organ health update, scored on the day just lived (current markers).
  const organs = { ...state.organs };
  const organDelta = {} as Record<OrganKey, number>;
  for (const okey of Object.keys(ORGANS) as OrganKey[]) {
    const organ = ORGANS[okey];
    let damage = 0;
    let totalWeight = 0;
    for (const mkey of Object.keys(organ.sensitivity) as MarkerKey[]) {
      const w = organ.sensitivity[mkey] ?? 0;
      totalWeight += w;
      damage += w * deviation(mkey, state.markers[mkey]);
    }
    const avgDeviation = totalWeight > 0 ? damage / totalWeight : 0;

    // Healthy day (no deviation) -> small heal. Bad day -> damage scaled up.
    const HEAL_RATE = 1.5;
    const DAMAGE_RATE = 14;
    const delta = avgDeviation === 0 ? HEAL_RATE : -avgDeviation * DAMAGE_RATE;

    const before = organs[okey];
    organs[okey] = clamp(before + delta, [0, 100]);
    organDelta[okey] = Math.round((organs[okey] - before) * 10) / 10;
  }

  // 2. Reset markers to baseline for the next day.
  const markers = {} as Record<MarkerKey, number>;
  for (const k of Object.keys(MARKERS) as MarkerKey[]) {
    markers[k] = MARKERS[k].baseline;
  }

  return {
    next: { markers, organs, day: state.day + 1 },
    organDelta,
  };
}

/** Qualitative label + colour for an organ health score. */
export function organStatus(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) return { label: "Thriving", color: "#16a34a" };
  if (score >= 60) return { label: "Healthy", color: "#65a30d" };
  if (score >= 40) return { label: "Strained", color: "#d97706" };
  if (score >= 20) return { label: "At risk", color: "#ea580c" };
  return { label: "Critical", color: "#dc2626" };
}

export function markerStatus(key: MarkerKey, value: number): {
  label: string;
  color: string;
} {
  const dev = deviation(key, value);
  if (dev === 0) return { label: "In range", color: "#16a34a" };
  if (dev < 0.15) return { label: "Borderline", color: "#d97706" };
  return { label: "Out of range", color: "#dc2626" };
}

function clamp(v: number, [lo, hi]: [number, number]): number {
  return Math.max(lo, Math.min(hi, v));
}
