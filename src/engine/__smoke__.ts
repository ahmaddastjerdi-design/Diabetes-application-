/**
 * __smoke__.ts — runtime sanity checks for the simulation engine.
 * Run with: npx tsx src/engine/__smoke__.ts
 * Not a unit-test framework; just fast confidence that the model behaves.
 */
import {
  initialBodyState,
  applyActionEffects,
  advanceDay,
  baselineMarkers,
  estimatedA1c,
  BodyState,
} from "./physiology";
import { getAction } from "../data/actions";

function simulate(actionIds: string[], days: number): BodyState {
  let state = initialBodyState();
  for (let d = 0; d < days; d++) {
    // Each day starts from baseline, then the day's choices are applied.
    state = { ...state, markers: baselineMarkers() };
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

// The healthy routine keeps glucose in range, so estimated A1c lands on target;
// the poor routine runs glucose high, so its A1c is clearly worse.
const healthyA1c = estimatedA1c(healthy.history.map((h) => h.glucose)) ?? 0;
const unhealthyA1c = estimatedA1c(unhealthy.history.map((h) => h.glucose)) ?? 0;
expect("healthy routine yields a lower A1c", healthyA1c < unhealthyA1c);
expect("healthy A1c is on target (<7.5%)", healthyA1c < 7.5);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
