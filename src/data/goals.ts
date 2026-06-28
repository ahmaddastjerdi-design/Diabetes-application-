/**
 * goals.ts — lightweight daily goals that give the loop a once-a-day hook.
 *
 * Goals reset each real calendar day. They're intentionally simple (complete /
 * not) and pay a small XP bonus — scaffolding to bring the patient back daily,
 * per the engagement evidence (see DESIGN.md).
 */
export interface GoalDef {
  id: string;
  label: string;
  emoji: string;
  bonusXp: number;
}

export const DAILY_GOALS: GoalDef[] = [
  { id: "move", label: "Log a walk or workout", emoji: "🚶", bonusXp: 20 },
  { id: "balance", label: "Get every marker in range", emoji: "⚖️", bonusXp: 25 },
  { id: "learn", label: "Finish a lesson", emoji: "📚", bonusXp: 20 },
];

export interface DailyGoalsState {
  /** YYYY-MM-DD the goals belong to. */
  date: string;
  /** Completed goal ids for that day. */
  done: string[];
}

/** Real calendar day key. Injectable for testing. */
export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function freshGoals(date: string): DailyGoalsState {
  return { date, done: [] };
}

/**
 * Mark a goal complete (idempotent), resetting first if the stored day is stale.
 * Returns the next state and any XP newly earned.
 */
export function completeGoal(
  state: DailyGoalsState,
  id: string,
  today: string
): { next: DailyGoalsState; bonusXp: number; justCompleted: boolean } {
  const base = state.date === today ? state : freshGoals(today);
  if (base.done.includes(id)) {
    return { next: base, bonusXp: 0, justCompleted: false };
  }
  const def = DAILY_GOALS.find((g) => g.id === id);
  return {
    next: { ...base, done: [...base.done, id] },
    bonusXp: def?.bonusXp ?? 0,
    justCompleted: true,
  };
}
