/**
 * gamification.ts — the motivation layer.
 *
 * Grounded in Self-Determination Theory (Ryan & Deci): durable motivation needs
 *   - Autonomy   : the patient chooses their own daily goals.
 *   - Competence : XP and levels make improvement visible.
 *   - Relatedness: badges/milestones to share (social comes later).
 *
 * Deliberate design choices from the behaviour-change evidence base:
 *   - Points/badges are SCAFFOLDING, not the point — they carry the patient
 *     through the hard first weeks until the behaviour pays its own rewards.
 *   - The streak is FORGIVING (one grace day), because punishing streaks that
 *     reset to zero use loss-aversion and drive people to quit.
 */

export interface ProgressState {
  xp: number;
  /** Consecutive days with at least one logged action. */
  streak: number;
  /** Grace days remaining before the streak breaks (refills over time). */
  graceDays: number;
  /** Earned badge ids. */
  badges: string[];
  /** Day index of the last day the patient logged anything. */
  lastActiveDay: number;
}

export function initialProgress(): ProgressState {
  return { xp: 0, streak: 0, graceDays: 1, badges: [], lastActiveDay: -1 };
}

/** XP needed to reach a given level (gentle quadratic curve). */
export function xpForLevel(level: number): number {
  return Math.round(50 * level * level + 50 * level);
}

export function levelFromXp(xp: number): {
  level: number;
  intoLevel: number;
  span: number;
  progress: number;
} {
  let level = 1;
  while (xp >= xpForLevel(level)) level++;
  const floor = level === 1 ? 0 : xpForLevel(level - 1);
  const ceil = xpForLevel(level);
  const intoLevel = xp - floor;
  const span = ceil - floor;
  return { level, intoLevel, span, progress: span > 0 ? intoLevel / span : 0 };
}

export interface BadgeDef {
  id: string;
  label: string;
  emoji: string;
  description: string;
  /** Returns true when the badge should be unlocked. */
  earned: (ctx: BadgeContext) => boolean;
}

export interface BadgeContext {
  progress: ProgressState;
  organs: { heart: number; kidney: number };
  lessonsCompleted: number;
  inRangeMarkers: number; // how many markers are currently in range
}

export const BADGES: BadgeDef[] = [
  {
    id: "first-step",
    label: "First Step",
    emoji: "👣",
    description: "Log your very first action.",
    earned: (c) => c.progress.xp > 0,
  },
  {
    id: "streak-3",
    label: "On a Roll",
    emoji: "🔥",
    description: "Keep a 3-day streak.",
    earned: (c) => c.progress.streak >= 3,
  },
  {
    id: "streak-7",
    label: "Week Warrior",
    emoji: "📅",
    description: "Keep a 7-day streak.",
    earned: (c) => c.progress.streak >= 7,
  },
  {
    id: "scholar",
    label: "Scholar",
    emoji: "🎓",
    description: "Complete 3 lessons.",
    earned: (c) => c.lessonsCompleted >= 3,
  },
  {
    id: "heart-hero",
    label: "Heart Hero",
    emoji: "❤️",
    description: "Get your heart to Thriving (80+).",
    earned: (c) => c.organs.heart >= 80,
  },
  {
    id: "kidney-keeper",
    label: "Kidney Keeper",
    emoji: "🫘",
    description: "Get your kidneys to Thriving (80+).",
    earned: (c) => c.organs.kidney >= 80,
  },
  {
    id: "in-balance",
    label: "In Balance",
    emoji: "⚖️",
    description: "Have every marker in range at once.",
    earned: (c) => c.inRangeMarkers >= 4,
  },
];

/** XP awards for the different things a patient can do. */
export const XP = {
  logAction: 10,
  completeLesson: 40,
  passQuiz: 25,
  dailyAllMarkersInRange: 30,
} as const;

/**
 * Register activity for the current day, updating streak + grace days.
 * Returns the updated progress and whether the streak advanced.
 */
export function registerActivity(
  progress: ProgressState,
  today: number
): { progress: ProgressState; streakAdvanced: boolean } {
  if (progress.lastActiveDay === today) {
    return { progress, streakAdvanced: false }; // already counted today
  }
  const gap = progress.lastActiveDay < 0 ? 1 : today - progress.lastActiveDay;
  let { streak, graceDays } = progress;

  if (gap === 1) {
    streak += 1;
    graceDays = Math.min(1, graceDays + 0); // grace refills slowly elsewhere
  } else if (gap === 2 && graceDays > 0) {
    streak += 1; // forgiven: one missed day doesn't break the streak
    graceDays -= 1;
  } else {
    streak = 1; // streak broke, but we restart at 1, never shame to 0
  }

  return {
    progress: { ...progress, streak, graceDays, lastActiveDay: today },
    streakAdvanced: true,
  };
}

/** Recompute which badges are earned, returning newly unlocked ones. */
export function reconcileBadges(
  progress: ProgressState,
  ctx: BadgeContext
): { progress: ProgressState; newlyEarned: BadgeDef[] } {
  const owned = new Set(progress.badges);
  const newlyEarned: BadgeDef[] = [];
  for (const b of BADGES) {
    if (!owned.has(b.id) && b.earned(ctx)) {
      owned.add(b.id);
      newlyEarned.push(b);
    }
  }
  return {
    progress: { ...progress, badges: [...owned] },
    newlyEarned,
  };
}
