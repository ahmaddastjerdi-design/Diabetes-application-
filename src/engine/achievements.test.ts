import { describe, it, expect } from "@jest/globals";
import {
  ACHIEVEMENTS,
  tierFor,
  nextTier,
  reconcileAchievements,
  Tier,
} from "./achievements";

const streakDef = ACHIEVEMENTS.find((a) => a.id === "streak")!;

const ctx = (over: Partial<Record<string, number>> = {}) => ({
  streak: 0,
  lessons: 0,
  daysLogged: 0,
  heart: 70,
  kidney: 70,
  ...over,
});

describe("tierFor", () => {
  it("returns null below the bronze threshold", () => {
    expect(tierFor(streakDef, 2)).toBeNull();
  });
  it("returns the highest tier reached", () => {
    expect(tierFor(streakDef, 3)).toBe("bronze");
    expect(tierFor(streakDef, 7)).toBe("silver");
    expect(tierFor(streakDef, 30)).toBe("gold");
    expect(tierFor(streakDef, 100)).toBe("gold");
  });
});

describe("nextTier", () => {
  it("points at bronze when nothing is earned", () => {
    expect(nextTier(streakDef, null)?.tier).toBe("bronze");
  });
  it("advances through the tiers", () => {
    expect(nextTier(streakDef, "bronze")?.tier).toBe("silver");
    expect(nextTier(streakDef, "silver")?.tier).toBe("gold");
  });
  it("returns null once gold is reached", () => {
    expect(nextTier(streakDef, "gold")).toBeNull();
  });
});

describe("reconcileAchievements", () => {
  it("earns a tier and reports it as newly unlocked", () => {
    const r = reconcileAchievements({}, ctx({ streak: 7 }));
    expect(r.earned.streak).toBe("silver");
    expect(r.newly.some((n) => n.def.id === "streak" && n.tier === "silver")).toBe(
      true
    );
  });
  it("never downgrades an earned tier when the metric drops", () => {
    const earned: Record<string, Tier> = { streak: "silver" };
    const r = reconcileAchievements(earned, ctx({ streak: 2 }));
    expect(r.earned.streak).toBe("silver");
    expect(r.newly).toHaveLength(0);
  });
  it("upgrades from a lower tier and only reports the upgrade", () => {
    const r = reconcileAchievements({ streak: "bronze" }, ctx({ streak: 30 }));
    expect(r.earned.streak).toBe("gold");
    expect(r.newly).toHaveLength(1);
  });
  it("earns every achievement at once when all metrics are maxed", () => {
    const r = reconcileAchievements(
      {},
      ctx({ streak: 30, lessons: 4, daysLogged: 30, heart: 97, kidney: 97 })
    );
    expect(r.newly).toHaveLength(ACHIEVEMENTS.length);
    expect(Object.values(r.earned).every((t) => t === "gold")).toBe(true);
  });
});

describe("organ-health achievement tiers", () => {
  const heartDef = ACHIEVEMENTS.find((a) => a.id === "heart-guardian")!;

  it("tiers at the organ-health thresholds", () => {
    expect(tierFor(heartDef, 79)).toBeNull();
    expect(tierFor(heartDef, 80)).toBe("bronze");
    expect(tierFor(heartDef, 90)).toBe("silver");
    expect(tierFor(heartDef, 97)).toBe("gold");
  });
  it("points at the right next threshold", () => {
    expect(nextTier(heartDef, null)?.threshold).toBe(80);
    expect(nextTier(heartDef, "silver")?.threshold).toBe(97);
  });
});
