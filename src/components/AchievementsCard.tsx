/**
 * AchievementsCard.tsx — the tiered-achievement showcase (Profile screen).
 * Shows each achievement's earned tier and progress toward the next one.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useGame } from "../state/GameContext";
import {
  ACHIEVEMENTS,
  AchievementCtx,
  TIER_META,
  TIER_ORDER,
  nextTier,
} from "../engine/achievements";
import { Card, ProgressBar } from "./ui";
import { theme } from "../theme";

export function AchievementsCard() {
  const { progress, completedLessons, body } = useGame();
  const earned = progress.achievements ?? {};

  const ctx: AchievementCtx = {
    streak: progress.streak,
    lessons: completedLessons.length,
    daysLogged: body.day,
    heart: body.organs.heart,
    kidney: body.organs.kidney,
  };

  return (
    <View style={{ gap: theme.space(2.5) }}>
      {ACHIEVEMENTS.map((def) => {
        const current = earned[def.id] ?? null;
        const value = Math.round(def.metric(ctx));
        const next = nextTier(def, current);
        const ratio = next ? Math.min(1, value / next.threshold) : 1;
        const barColor = current
          ? TIER_META[current].color
          : theme.colors.primary;

        return (
          <Card key={def.id} style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.emoji}>{def.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{def.title}</Text>
                <Text style={styles.value}>
                  {value} {def.unit}
                </Text>
              </View>
              <View style={styles.tiers}>
                {TIER_ORDER.map((t) => {
                  const has =
                    current && TIER_ORDER.indexOf(current) >= TIER_ORDER.indexOf(t);
                  return (
                    <Text key={t} style={[styles.tier, !has && styles.tierLocked]}>
                      {TIER_META[t].emoji}
                    </Text>
                  );
                })}
              </View>
            </View>

            <ProgressBar value={ratio} color={barColor} height={8} />
            <Text style={styles.next}>
              {next
                ? `${value}/${next.threshold} to ${TIER_META[next.tier].label}`
                : "Maxed out — Gold tier! 🥇"}
            </Text>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.space(2) },
  header: { flexDirection: "row", alignItems: "center", gap: theme.space(3) },
  emoji: { fontSize: 28 },
  title: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  value: { fontSize: 12, color: theme.colors.subtext, marginTop: 1 },
  tiers: { flexDirection: "row", gap: 2 },
  tier: { fontSize: 18 },
  tierLocked: { opacity: 0.22 },
  next: { fontSize: 11, color: theme.colors.subtext, textAlign: "right" },
});
