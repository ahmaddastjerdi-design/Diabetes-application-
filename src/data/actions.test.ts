import { describe, it, expect } from "@jest/globals";
import {
  ACTIONS,
  ACTIONS_BY_CATEGORY,
  getAction,
  stepsToAction,
} from "./actions";

describe("getAction", () => {
  it("finds a known action and returns undefined otherwise", () => {
    expect(getAction("walk")?.label).toBeDefined();
    expect(getAction("does-not-exist")).toBeUndefined();
  });
});

describe("ACTIONS_BY_CATEGORY", () => {
  it("partitions every action under its own category", () => {
    (["diet", "exercise", "drug"] as const).forEach((cat) => {
      expect(ACTIONS_BY_CATEGORY[cat].every((a) => a.category === cat)).toBe(true);
    });
  });
  it("covers all actions across the categories", () => {
    const total =
      ACTIONS_BY_CATEGORY.diet.length +
      ACTIONS_BY_CATEGORY.exercise.length +
      ACTIONS_BY_CATEGORY.drug.length;
    expect(total).toBe(ACTIONS.length);
  });
});

describe("stepsToAction", () => {
  it("scales the benefit with steps and is an exercise action", () => {
    const a = stepsToAction(1800);
    expect(a.category).toBe("exercise");
    expect(a.effects.glucose).toBe(-10); // 1800/180
    expect(a.effects.systolic).toBe(-3); // round(1800/600)
  });
  it("caps the benefit so one day can't swing the model", () => {
    const a = stepsToAction(100000);
    expect(a.effects.glucose).toBe(-35);
    expect(a.effects.systolic).toBe(-12);
  });
  it("is a no-op benefit at zero steps", () => {
    const a = stepsToAction(0);
    expect(Math.abs(a.effects.glucose ?? NaN)).toBe(0);
    expect(Math.abs(a.effects.systolic ?? NaN)).toBe(0);
  });
});
