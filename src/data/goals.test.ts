import { describe, it, expect } from "@jest/globals";
import { todayKey, freshGoals, completeGoal, DAILY_GOALS } from "./goals";

describe("todayKey", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(todayKey(new Date("2026-06-28T10:00:00Z"))).toBe("2026-06-28");
  });
});

describe("completeGoal", () => {
  const today = "2026-06-28";

  it("completes a goal and awards its bonus", () => {
    const r = completeGoal(freshGoals(today), "move", today);
    expect(r.next.done).toContain("move");
    expect(r.justCompleted).toBe(true);
    const def = DAILY_GOALS.find((g) => g.id === "move")!;
    expect(r.bonusXp).toBe(def.bonusXp);
  });

  it("is idempotent for an already-completed goal", () => {
    const once = completeGoal(freshGoals(today), "move", today).next;
    const twice = completeGoal(once, "move", today);
    expect(twice.bonusXp).toBe(0);
    expect(twice.justCompleted).toBe(false);
  });

  it("resets when the stored day is stale", () => {
    const stale = { date: "2026-06-27", done: ["move"] };
    const r = completeGoal(stale, "move", today);
    expect(r.next.date).toBe(today);
    expect(r.justCompleted).toBe(true); // fresh day, so it counts again
    expect(r.bonusXp).toBeGreaterThan(0);
  });
});
