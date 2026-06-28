import { describe, it, expect } from "@jest/globals";
import { reduceLogAction, reduceCompleteLesson, GameSlice } from "./gameLogic";
import { initialBodyState } from "./physiology";
import { initialProgress, XP } from "./gamification";
import { freshGoals } from "../data/goals";
import { getAction } from "../data/actions";

const TODAY = "2026-06-28";

const initialSlice = (): GameSlice => ({
  body: initialBodyState(),
  progress: initialProgress(),
  completedLessons: [],
  dailyGoals: freshGoals(TODAY),
});

const walk = getAction("walk")!;
const sugary = getAction("sugary-drink")!;
const water = getAction("water")!;

describe("reduceLogAction", () => {
  it("advances the day and awards base XP + first-step badge", () => {
    const { next, result } = reduceLogAction(initialSlice(), walk, TODAY);
    expect(next.body.day).toBe(1);
    expect(result.xpGained).toBeGreaterThanOrEqual(XP.logAction);
    expect(result.newBadges.map((b) => b.id)).toContain("first-step");
  });

  it("a walk brings every marker in range and rewards it fully", () => {
    const { next, result } = reduceLogAction(initialSlice(), walk, TODAY);
    // base + all-in-range bonus + move goal + balance goal
    expect(result.xpGained).toBe(
      XP.logAction + XP.dailyAllMarkersInRange + 20 + 25
    );
    expect(next.dailyGoals.done).toEqual(
      expect.arrayContaining(["move", "balance"])
    );
    expect(result.newBadges.map((b) => b.id)).toContain("in-balance");
  });

  it("a sugary drink earns no bonuses and harms organs", () => {
    const { next, result } = reduceLogAction(initialSlice(), sugary, TODAY);
    expect(result.xpGained).toBe(XP.logAction); // no bonus, no goals
    expect(next.dailyGoals.done).toHaveLength(0);
    const harmed =
      result.organDelta.heart < 0 || result.organDelta.kidney < 0;
    expect(harmed).toBe(true);
  });

  it("increments the streak across consecutive days", () => {
    const first = reduceLogAction(initialSlice(), walk, TODAY);
    const second = reduceLogAction(first.next, walk, TODAY);
    expect(second.next.progress.streak).toBe(2);
  });

  it("does not re-award a daily goal already completed today", () => {
    const first = reduceLogAction(initialSlice(), walk, TODAY); // move+balance
    const second = reduceLogAction(first.next, walk, TODAY);
    // second walk still gets base + all-in-range, but no goal bonuses
    expect(second.result.xpGained).toBe(
      XP.logAction + XP.dailyAllMarkersInRange
    );
  });

  it("detects a level-up as XP crosses the threshold", () => {
    const first = reduceLogAction(initialSlice(), walk, TODAY); // 85 xp, level 1
    const second = reduceLogAction(first.next, walk, TODAY); // +40 -> 125, level 2
    expect(first.result.leveledUp).toBe(false);
    expect(second.result.leveledUp).toBe(true);
    expect(second.result.newLevel).toBe(2);
  });
});

describe("reduceCompleteLesson", () => {
  it("awards lesson XP + quiz bonus + learn goal the first time", () => {
    const { next, result } = reduceCompleteLesson(
      initialSlice(),
      "glucose-101",
      true,
      TODAY
    );
    expect(result.xpGained).toBe(XP.completeLesson + XP.passQuiz + 20);
    expect(next.completedLessons).toContain("glucose-101");
    expect(next.dailyGoals.done).toContain("learn");
  });

  it("earns the Scholar achievement on the first lesson", () => {
    const { result } = reduceCompleteLesson(
      initialSlice(),
      "glucose-101",
      true,
      TODAY
    );
    expect(result.newBadges.map((b) => b.id)).toContain("scholar-bronze");
  });

  it("is idempotent for an already-completed lesson", () => {
    const first = reduceCompleteLesson(initialSlice(), "glucose-101", true, TODAY);
    const second = reduceCompleteLesson(
      first.next,
      "glucose-101",
      true,
      TODAY
    );
    expect(second.result.xpGained).toBe(0);
    expect(second.next.completedLessons).toHaveLength(1);
  });
});

describe("reduceLogAction — integration edge cases", () => {
  it("a partial action (water) leaves glucose out, earning only base XP", () => {
    const { next, result } = reduceLogAction(initialSlice(), water, TODAY);
    expect(result.xpGained).toBe(XP.logAction); // glucose still out of range
    expect(next.dailyGoals.done).toHaveLength(0);
  });

  it("crossing an organ-health threshold earns the gold tier", () => {
    const slice: GameSlice = {
      body: { ...initialBodyState(), organs: { heart: 96, kidney: 96 } },
      progress: initialProgress(),
      completedLessons: [],
      dailyGoals: freshGoals(TODAY),
    };
    // A walk heals both organs past the gold threshold (97).
    const { result } = reduceLogAction(slice, walk, TODAY);
    expect(result.newBadges.map((b) => b.id)).toContain("heart-guardian-gold");
  });
});
