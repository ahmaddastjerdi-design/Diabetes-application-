/**
 * achievements.ts — tiered (bronze/silver/gold) long-term achievements.
 *
 * Where badges are one-off unlocks, achievements give a sense of *progression*:
 * each has three rising thresholds, and the highest tier earned is remembered
 * even if the underlying metric later dips (so you never "lose" an achievement).
 */
export type Tier = "bronze" | "silver" | "gold";

export const TIER_ORDER: Tier[] = ["bronze", "silver", "gold"];

export const TIER_META: Record<
  Tier,
  { label: string; emoji: string; color: string }
> = {
  bronze: { label: "Bronze", emoji: "🥉", color: "#b45309" },
  silver: { label: "Silver", emoji: "🥈", color: "#64748b" },
  gold: { label: "Gold", emoji: "🥇", color: "#f59e0b" },
};

export interface AchievementCtx {
  streak: number;
  lessons: number;
  daysLogged: number;
  heart: number;
  kidney: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  emoji: string;
  unit: string;
  thresholds: Record<Tier, number>;
  metric: (c: AchievementCtx) => number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "streak",
    title: "Consistency",
    emoji: "🔥",
    unit: "day streak",
    thresholds: { bronze: 3, silver: 7, gold: 30 },
    metric: (c) => c.streak,
  },
  {
    id: "scholar",
    title: "Scholar",
    emoji: "📚",
    unit: "lessons",
    thresholds: { bronze: 1, silver: 2, gold: 4 },
    metric: (c) => c.lessons,
  },
  {
    id: "dedication",
    title: "Dedication",
    emoji: "📆",
    unit: "days played",
    thresholds: { bronze: 5, silver: 15, gold: 30 },
    metric: (c) => c.daysLogged,
  },
  {
    id: "heart-guardian",
    title: "Heart Guardian",
    emoji: "❤️",
    unit: "heart health",
    thresholds: { bronze: 80, silver: 90, gold: 97 },
    metric: (c) => c.heart,
  },
  {
    id: "kidney-keeper",
    title: "Kidney Keeper",
    emoji: "🫘",
    unit: "kidney health",
    thresholds: { bronze: 80, silver: 90, gold: 97 },
    metric: (c) => c.kidney,
  },
];

/** Highest tier whose threshold the value meets, or null if none. */
export function tierFor(def: AchievementDef, value: number): Tier | null {
  let earned: Tier | null = null;
  for (const t of TIER_ORDER) {
    if (value >= def.thresholds[t]) earned = t;
  }
  return earned;
}

/** The next tier to aim for and its threshold, or null once gold is reached. */
export function nextTier(
  def: AchievementDef,
  current: Tier | null
): { tier: Tier; threshold: number } | null {
  const idx = current ? TIER_ORDER.indexOf(current) + 1 : 0;
  if (idx >= TIER_ORDER.length) return null;
  const tier = TIER_ORDER[idx];
  return { tier, threshold: def.thresholds[tier] };
}

function rank(t: Tier | null): number {
  return t ? TIER_ORDER.indexOf(t) + 1 : 0;
}

/**
 * Upgrade the earned-tier map against the current metrics, returning the new map
 * plus any achievements that just rose to a higher tier.
 */
export function reconcileAchievements(
  earned: Record<string, Tier>,
  ctx: AchievementCtx
): {
  earned: Record<string, Tier>;
  newly: { def: AchievementDef; tier: Tier }[];
} {
  const next = { ...earned };
  const newly: { def: AchievementDef; tier: Tier }[] = [];
  for (const def of ACHIEVEMENTS) {
    const value = def.metric(ctx);
    const reached = tierFor(def, value);
    if (reached && rank(reached) > rank(next[def.id] ?? null)) {
      next[def.id] = reached;
      newly.push({ def, tier: reached });
    }
  }
  return { earned: next, newly };
}
