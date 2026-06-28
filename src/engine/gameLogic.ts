/**
 * gameLogic.ts — the pure core of the game loop, extracted from the React
 * context so it can be unit-tested in isolation.
 *
 * These reducers take the current game slice (body + progress + lessons + daily
 * goals) and an action/lesson, and return the next slice plus a result for the
 * UI (XP gained, organ deltas, newly-earned badges/achievements, level-up). No
 * React, no storage, no side effects — given the same inputs they always return
 * the same outputs.
 */
import {
  BodyState,
  MarkerKey,
  OrganKey,
  advanceDay,
  applyActionEffects,
  baselineMarkers,
  deviation,
} from "./physiology";
import {
  ProgressState,
  XP,
  BadgeDef,
  levelFromXp,
  reconcileBadges,
  registerActivity,
} from "./gamification";
import {
  reconcileAchievements,
  TIER_META,
  Tier,
  AchievementDef,
} from "./achievements";
import { ActionDef } from "../data/actions";
import { DailyGoalsState, completeGoal } from "../data/goals";

/** The slice of state the game loop reads and writes. */
export interface GameSlice {
  body: BodyState;
  progress: ProgressState;
  completedLessons: string[];
  dailyGoals: DailyGoalsState;
}

export interface LogResult {
  organDelta: Record<OrganKey, number>;
  newBadges: BadgeDef[];
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
}

export interface LessonResult {
  newBadges: BadgeDef[];
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
}

/** Present a newly-earned achievement tier as a celebratory "badge". */
export function achievementToBadge({
  def,
  tier,
}: {
  def: AchievementDef;
  tier: Tier;
}): BadgeDef {
  const m = TIER_META[tier];
  return {
    id: `${def.id}-${tier}`,
    label: `${m.label}: ${def.title}`,
    emoji: m.emoji,
    description: `${def.title} — ${m.label} tier reached!`,
    earned: () => true,
  };
}

const badgeCtx = (
  b: BodyState,
  pr: ProgressState,
  lessons: number,
  inRange: number
) => ({
  progress: pr,
  organs: b.organs,
  lessonsCompleted: lessons,
  inRangeMarkers: inRange,
});

function countInRange(markers: Record<MarkerKey, number>): number {
  return (Object.keys(markers) as MarkerKey[]).filter(
    (k) => deviation(k, markers[k]) === 0
  ).length;
}

/**
 * Log a single action: start the day from baseline, apply the choice, score the
 * day, then award XP, advance daily goals + streak, and reconcile badges and
 * achievements.
 */
export function reduceLogAction(
  slice: GameSlice,
  action: ActionDef,
  today: string
): { next: GameSlice; result: LogResult } {
  const { body, progress, completedLessons, dailyGoals } = slice;

  // 1. New day from baseline, apply the choice, score the day.
  const fresh: BodyState = { ...body, markers: baselineMarkers() };
  const afterEffects = applyActionEffects(fresh, action.effects);
  const { next, organDelta } = advanceDay(afterEffects);

  // 2. XP: base for logging + bonus if every marker ended in range.
  const markerKeys = Object.keys(next.markers) as MarkerKey[];
  const inRange = countInRange(next.markers);
  const allInRange = inRange === markerKeys.length;
  let xpGained = XP.logAction + (allInRange ? XP.dailyAllMarkersInRange : 0);

  // 3. Daily goals: movement, and "everything in range".
  let goals = dailyGoals;
  const goalIds: string[] = [];
  if (action.category === "exercise") goalIds.push("move");
  if (allInRange) goalIds.push("balance");
  for (const id of goalIds) {
    const r = completeGoal(goals, id, today);
    goals = r.next;
    xpGained += r.bonusXp;
  }

  // 4. Streak + XP into progress.
  const activity = registerActivity(progress, next.day);
  const withXp: ProgressState = {
    ...activity.progress,
    xp: activity.progress.xp + xpGained,
  };

  // 5. Badges + tiered achievements.
  const reconciled = reconcileBadges(
    withXp,
    badgeCtx(next, withXp, completedLessons.length, inRange)
  );
  const ach = reconcileAchievements(reconciled.progress.achievements ?? {}, {
    streak: reconciled.progress.streak,
    lessons: completedLessons.length,
    daysLogged: next.day,
    heart: next.organs.heart,
    kidney: next.organs.kidney,
  });
  const finalProgress: ProgressState = {
    ...reconciled.progress,
    achievements: ach.earned,
  };

  const prevLevel = levelFromXp(progress.xp).level;
  const newLevel = levelFromXp(finalProgress.xp).level;

  return {
    next: { body: next, progress: finalProgress, completedLessons, dailyGoals: goals },
    result: {
      organDelta,
      newBadges: [
        ...reconciled.newlyEarned,
        ...ach.newly.map(achievementToBadge),
      ],
      xpGained,
      leveledUp: newLevel > prevLevel,
      newLevel,
    },
  };
}

/**
 * Complete a lesson: award XP (first time only), advance the "learn" daily goal,
 * and reconcile badges + achievements.
 */
export function reduceCompleteLesson(
  slice: GameSlice,
  lessonId: string,
  passedQuiz: boolean,
  today: string
): { next: GameSlice; result: LessonResult } {
  const { body, progress, completedLessons, dailyGoals } = slice;

  const already = completedLessons.includes(lessonId);
  const lessons = already ? completedLessons : [...completedLessons, lessonId];

  let xpGained = already
    ? 0
    : XP.completeLesson + (passedQuiz ? XP.passQuiz : 0);

  // Daily goal: finish a lesson (only the first lesson finished today).
  let goals = dailyGoals;
  if (!already) {
    const r = completeGoal(goals, "learn", today);
    goals = r.next;
    xpGained += r.bonusXp;
  }

  const withXp: ProgressState = { ...progress, xp: progress.xp + xpGained };
  const reconciled = reconcileBadges(
    withXp,
    badgeCtx(body, withXp, lessons.length, countInRange(body.markers))
  );
  const ach = reconcileAchievements(reconciled.progress.achievements ?? {}, {
    streak: reconciled.progress.streak,
    lessons: lessons.length,
    daysLogged: body.day,
    heart: body.organs.heart,
    kidney: body.organs.kidney,
  });
  const finalProgress: ProgressState = {
    ...reconciled.progress,
    achievements: ach.earned,
  };

  const prevLevel = levelFromXp(progress.xp).level;
  const newLevel = levelFromXp(finalProgress.xp).level;

  return {
    next: {
      body,
      progress: finalProgress,
      completedLessons: lessons,
      dailyGoals: goals,
    },
    result: {
      newBadges: [
        ...reconciled.newlyEarned,
        ...ach.newly.map(achievementToBadge),
      ],
      xpGained,
      leveledUp: newLevel > prevLevel,
      newLevel,
    },
  };
}
