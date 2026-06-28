/**
 * GoalsCard.tsx — today's daily goals, the once-a-day hook. Reads the
 * normalised `goalsToday` from context so a stale day shows as fresh.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useGame } from "../state/GameContext";
import { DAILY_GOALS } from "../data/goals";
import { Card } from "./ui";
import { theme } from "../theme";

export function GoalsCard() {
  const { goalsToday } = useGame();
  const done = new Set(goalsToday.done);
  const completedCount = DAILY_GOALS.filter((g) => done.has(g.id)).length;
  const allDone = completedCount === DAILY_GOALS.length;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's goals</Text>
        <Text style={styles.count}>
          {completedCount}/{DAILY_GOALS.length}
        </Text>
      </View>

      {DAILY_GOALS.map((g) => {
        const isDone = done.has(g.id);
        return (
          <View key={g.id} style={styles.row}>
            <Text style={styles.check}>{isDone ? "✅" : "⬜️"}</Text>
            <Text style={[styles.label, isDone && styles.labelDone]}>
              {g.emoji} {g.label}
            </Text>
            <Text style={[styles.xp, isDone && styles.xpDone]}>+{g.bonusXp}</Text>
          </View>
        );
      })}

      {allDone && (
        <Text style={styles.allDone}>🎉 All done today — see you tomorrow!</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.space(2) },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 17, fontWeight: "700", color: theme.colors.text },
  count: { fontSize: 14, fontWeight: "800", color: theme.colors.primary },
  row: { flexDirection: "row", alignItems: "center", gap: theme.space(2.5) },
  check: { fontSize: 16 },
  label: { flex: 1, fontSize: 14, fontWeight: "600", color: theme.colors.text },
  labelDone: {
    color: theme.colors.subtext,
    textDecorationLine: "line-through",
  },
  xp: { fontSize: 13, fontWeight: "800", color: theme.colors.xp },
  xpDone: { color: theme.colors.subtext },
  allDone: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.good,
    marginTop: theme.space(1),
  },
});
