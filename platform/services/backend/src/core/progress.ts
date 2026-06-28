/**
 * progress.ts — SERVER-side gamification derivation (Vol 4 §gamification).
 *
 * The prototype trusts the client to compute XP/streak/badges. The platform does NOT:
 * the server derives them deterministically from an append-only event log, so a
 * tampered client cannot mint XP. This mirrors the rules in the prototype's
 * `src/engine/gamification.ts` (forgiving streak, XP awards) but is the authority.
 */

/** Append-only domain events the client emits; the log is immutable (Vol 4/8). */
export type DomainEvent =
  | { type: "action_logged"; day: number; allMarkersInRange: boolean }
  | { type: "lesson_completed"; lessonId: string; passedQuiz: boolean };

/** XP awards — kept in lockstep with the prototype engine's `XP` constants. */
export const XP = {
  logAction: 10,
  completeLesson: 40,
  passQuiz: 25,
  dailyAllMarkersInRange: 30,
} as const;

export interface DerivedProgress {
  xp: number;
  streak: number;
  graceDays: number;
  lastActiveDay: number;
  lessonsCompleted: number;
}

/**
 * Fold the event log into the authoritative progress state. Forgiving streak:
 * a one-day gap is absorbed by a grace day; a larger gap restarts the streak at 1,
 * never at 0 (per the behaviour-change evidence in DESIGN.md / Vol 1).
 */
export function deriveProgress(events: readonly DomainEvent[]): DerivedProgress {
  let xp = 0;
  let streak = 0;
  let graceDays = 1;
  let lastActiveDay = -1;
  const lessons = new Set<string>();

  for (const e of events) {
    if (e.type === "action_logged") {
      xp += XP.logAction + (e.allMarkersInRange ? XP.dailyAllMarkersInRange : 0);
      if (e.day !== lastActiveDay) {
        const gap = lastActiveDay < 0 ? 1 : e.day - lastActiveDay;
        if (gap === 1) {
          streak += 1;
        } else if (gap === 2 && graceDays > 0) {
          streak += 1;
          graceDays -= 1;
        } else {
          streak = 1;
        }
        lastActiveDay = e.day;
      }
    } else {
      if (!lessons.has(e.lessonId)) {
        lessons.add(e.lessonId);
        xp += XP.completeLesson + (e.passedQuiz ? XP.passQuiz : 0);
      }
    }
  }

  return { xp, streak, graceDays, lastActiveDay, lessonsCompleted: lessons.size };
}

/** XP needed to reach a level (gentle quadratic curve — matches the prototype). */
export function xpForLevel(level: number): number {
  return Math.round(50 * level * level + 50 * level);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level)) level++;
  return level;
}
