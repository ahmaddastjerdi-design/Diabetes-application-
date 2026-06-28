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

/** A daily snapshot of organ health (+ the day's glucose), for trends. */
export interface OrganSnapshot {
  day: number;
  heart: number;
  kidney: number;
  /** The glucose level the patient "lived" that day (drives estimated A1c). */
  glucose: number;
}

/** How many days of organ history we keep. */
export const HISTORY_LIMIT = 30;

/** The full simulated body state. Persisted between sessions. */
export interface BodyState {
  markers: Record<MarkerKey, number>;
  /** Organ health 0 (failing) .. 100 (excellent). */
  organs: Record<OrganKey, number>;
  /** Day index since the patient started. */
  day: number;
  /** Trailing organ-health snapshots (oldest first), capped to HISTORY_LIMIT. */
  history: OrganSnapshot[];
}

/** The untreated daily starting point for every marker. */
export function baselineMarkers(): Record<MarkerKey, number> {
  return {
    glucose: MARKERS.glucose.baseline,
    systolic: MARKERS.systolic.baseline,
    hydration: MARKERS.hydration.baseline,
    ldl: MARKERS.ldl.baseline,
  };
}

export function initialBodyState(): BodyState {
  return {
    markers: baselineMarkers(),
    organs: { heart: 70, kidney: 70 },
    day: 0,
    history: [
      { day: 0, heart: 70, kidney: 70, glucose: MARKERS.glucose.baseline },
    ],
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
 * Advance one simulated day. The input `state.markers` are the values the
 * patient "lived" today (baseline + today's choices). We score the organs on
 * those values and KEEP them as the visible markers, so the dashboard reflects
 * what the latest choice did. The reset back to baseline happens at the START of
 * the next day (see logAction), not here.
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

  // 2. Record the new organ snapshot, capped to the trailing window.
  const day = state.day + 1;
  const history = [
    ...(state.history ?? []),
    {
      day,
      heart: organs.heart,
      kidney: organs.kidney,
      glucose: state.markers.glucose, // the glucose just "lived" this day
    },
  ].slice(-HISTORY_LIMIT);

  // Keep the lived markers visible; the next day resets to baseline.
  return {
    next: { markers: state.markers, organs, day, history },
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

/**
 * Estimated HbA1c (%) from a series of daily glucose values, using the standard
 * ADAG relationship eA1c = (avg mg/dL + 46.7) / 28.7. A slow, long-term measure
 * of overall glucose control — the number clinicians actually track. Returns
 * null when there isn't enough history yet.
 */
export function estimatedA1c(glucoseHistory: number[]): number | null {
  if (glucoseHistory.length === 0) return null;
  const avg =
    glucoseHistory.reduce((a, b) => a + b, 0) / glucoseHistory.length;
  return Math.round(((avg + 46.7) / 28.7) * 10) / 10;
}

/** Status band for an estimated A1c value (clinical-ish targets). */
export function a1cStatus(a1c: number): { label: string; color: string } {
  if (a1c < 5.7) return { label: "Normal", color: "#16a34a" };
  if (a1c < 7.0) return { label: "On target", color: "#65a30d" };
  if (a1c < 8.0) return { label: "Above target", color: "#d97706" };
  return { label: "High", color: "#dc2626" };
}

/** Plain-language tip for bringing a marker back into its healthy range. */
export const MARKER_TIPS: Record<MarkerKey, string> = {
  glucose: "Take a walk or your glucose medicine to bring blood sugar down.",
  systolic: "Cut back on salt and take your blood-pressure medicine.",
  hydration: "Drink a glass of water to help your kidneys filter.",
  ldl: "Choose healthy fats (like fish) and take your statin.",
};

export interface OrganInsight {
  marker: MarkerKey;
  value: number;
  weight: number;
  status: ReturnType<typeof markerStatus>;
  inRange: boolean;
  tip: string;
}

/**
 * For an organ, the markers that affect it — most-out-of-range first — so the
 * detail sheet can explain "what's helping / hurting this organ right now".
 */
export function organInsights(
  organKey: OrganKey,
  markers: Record<MarkerKey, number>
): OrganInsight[] {
  const sens = ORGANS[organKey].sensitivity;
  return (Object.keys(sens) as MarkerKey[])
    .map((marker) => {
      const value = markers[marker];
      const dev = deviation(marker, value);
      return {
        marker,
        value,
        weight: sens[marker] ?? 0,
        status: markerStatus(marker, value),
        inRange: dev === 0,
        tip: MARKER_TIPS[marker],
      };
    })
    .sort((a, b) => deviation(b.marker, b.value) - deviation(a.marker, a.value));
}

function clamp(v: number, [lo, hi]: [number, number]): number {
  return Math.max(lo, Math.min(hi, v));
}
