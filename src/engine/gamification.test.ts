import { describe, it, expect } from "@jest/globals";
import {
  xpForLevel,
  levelFromXp,
  initialProgress,
  registerActivity,
  reconcileBadges,
  ProgressState,
} from "./gamification";

describe("levels", () => {
  it("xpForLevel grows with level", () => {
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(2)).toBeGreaterThan(xpForLevel(1));
  });
  it("levelFromXp crosses at the threshold", () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
  });
  it("reports fractional progress within a level", () => {
    const l = levelFromXp(50);
    expect(l.level).toBe(1);
    expect(l.progress).toBeCloseTo(0.5, 1);
  });
});

describe("registerActivity (streak)", () => {
  it("starts a streak on first activity", () => {
    const r = registerActivity(initialProgress(), 0);
    expect(r.streakAdvanced).toBe(true);
    expect(r.progress.streak).toBe(1);
  });
  it("increments on consecutive days", () => {
    let p = registerActivity(initialProgress(), 0).progress;
    p = registerActivity(p, 1).progress;
    expect(p.streak).toBe(2);
  });
  it("does not double-count the same day", () => {
    const p = registerActivity(initialProgress(), 0).progress;
    const r = registerActivity(p, 0);
    expect(r.streakAdvanced).toBe(false);
    expect(r.progress.streak).toBe(1);
  });
  it("forgives one missed day using a grace day", () => {
    const p = registerActivity(initialProgress(), 0).progress; // streak 1, grace 1
    const r = registerActivity(p, 2); // gap of 2
    expect(r.progress.streak).toBe(2);
    expect(r.progress.graceDays).toBe(0);
  });
  it("restarts at 1 (never 0) when the streak truly breaks", () => {
    let p = registerActivity(initialProgress(), 0).progress;
    p = { ...p, graceDays: 0 };
    const r = registerActivity(p, 5);
    expect(r.progress.streak).toBe(1);
  });
});

describe("reconcileBadges", () => {
  const ctx = (over: Partial<ProgressState>, extra = {}) => ({
    progress: { ...initialProgress(), ...over },
    organs: { heart: 70, kidney: 70 },
    lessonsCompleted: 0,
    inRangeMarkers: 0,
    ...extra,
  });

  it("awards first-step once XP exists", () => {
    const r = reconcileBadges(
      { ...initialProgress(), xp: 10 },
      ctx({ xp: 10 })
    );
    expect(r.newlyEarned.map((b) => b.id)).toContain("first-step");
  });
  it("awards in-balance when all four markers are in range", () => {
    const p = { ...initialProgress(), xp: 10 };
    const r = reconcileBadges(p, ctx({ xp: 10 }, { inRangeMarkers: 4 }));
    expect(r.newlyEarned.map((b) => b.id)).toContain("in-balance");
  });
  it("does not re-award an owned badge", () => {
    const p = { ...initialProgress(), xp: 10, badges: ["first-step"] };
    const r = reconcileBadges(p, ctx({ xp: 10, badges: ["first-step"] }));
    expect(r.newlyEarned.map((b) => b.id)).not.toContain("first-step");
  });
});
