/**
 * __smoke__.ts — runtime sanity checks for the simulation engine.
 * Run with: npx tsx src/engine/__smoke__.ts
 * Not a unit-test framework; just fast confidence that the model behaves.
 */
import {
  initialBodyState,
  applyActionEffects,
  advanceDay,
  BodyState,
  MARKERS,
} from "./physiology";
import { getAction } from "../data/actions";
import { formatMarker, mgdlToMmol } from "../lib/units";
import { localCoachReply } from "../lib/coach";
import { validateGlucoseReading, classifyGlucose } from "../lib/health";

function simulate(actionIds: string[], days: number): BodyState {
  let state = initialBodyState();
  for (let d = 0; d < days; d++) {
    for (const id of actionIds) {
      const a = getAction(id);
      if (a) state = applyActionEffects(state, a.effects);
    }
    state = advanceDay(state).next;
  }
  return state;
}

let failures = 0;
function expect(name: string, cond: boolean) {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

// A patient who walks, takes meds, drinks water and eats well should see
// organ health climb above the starting 70.
const healthy = simulate(
  ["walk", "metformin", "water", "balanced-meal", "bp-med", "statin"],
  20
);
expect("healthy routine improves the heart", healthy.organs.heart > 70);
expect("healthy routine improves the kidneys", healthy.organs.kidney > 70);

// A patient living on sugary drinks, salty food and skipped meds should decline.
const unhealthy = simulate(
  ["sugary-drink", "salty-meal", "missed-meds", "rest-day"],
  20
);
expect("poor routine harms the heart", unhealthy.organs.heart < 70);
expect("poor routine harms the kidneys", unhealthy.organs.kidney < 70);

// Organ health must always stay within [0, 100].
const extreme = simulate(["sugary-drink", "salty-meal", "missed-meds"], 60);
expect(
  "organ health never goes below 0",
  extreme.organs.heart >= 0 && extreme.organs.kidney >= 0
);
expect(
  "organ health never exceeds 100",
  healthy.organs.heart <= 100 && healthy.organs.kidney <= 100
);

// Glucose unit conversion + formatting (PRD units).
expect("glucose 140 mg/dL ≈ 7.8 mmol/L", Math.abs(mgdlToMmol(140) - 7.77) < 0.05);
const mmol = formatMarker(MARKERS.glucose, 140, "mmol/L");
expect("formatMarker converts glucose to mmol/L", mmol.unit === "mmol/L" && mmol.value === "7.8");
const mgdl = formatMarker(MARKERS.glucose, 140, "mg/dL");
expect("formatMarker keeps mg/dL by default", mgdl.unit === "mg/dL" && mgdl.value === "140");

// AI coach safety guardrails (must hold on-device, offline).
expect("coach escalates a red-flag emergency", localCoachReply("I have chest pain").tier === "tier3");
expect("coach hard-blocks dosing questions", localCoachReply("how much insulin should I take").guardrailed === true);
expect("coach answers an educational question normally", localCoachReply("how does a walk help?").tier === "none");

// Manual device readings: validation + classification (PRD device entry).
expect("glucose reading 7 mmol/L normalises to ~126 mg/dL", validateGlucoseReading(7, "mmol/L").mgdl === 126);
expect("implausible glucose reading is rejected", validateGlucoseReading(5, "mg/dL").ok === false);
expect("a valid mg/dL reading is accepted", validateGlucoseReading(120, "mg/dL").ok === true);
expect("classifyGlucose flags low / in-range / high",
  classifyGlucose(60) === "low" && classifyGlucose(120) === "in-range" && classifyGlucose(250) === "high");

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
