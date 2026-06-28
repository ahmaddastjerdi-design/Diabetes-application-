/** ProfileScreen.tsx — badges, level summary, and a reset for testing. */
import React from "react";
import { ScrollView, View, Text, StyleSheet, Alert } from "react-native";
import { useGame } from "../state/GameContext";
import { BADGES } from "../engine/gamification";
import { Card, Button, ProgressBar } from "../components/ui";
import { theme } from "../theme";

export function ProfileScreen() {
  const { progress, level, completedLessons, reset } = useGame();
  const owned = new Set(progress.badges);

  const confirmReset = () =>
    Alert.alert("Reset progress?", "This clears all your journey data.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: reset },
    ]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.h1}>Your progress</Text>

      <Card style={{ gap: theme.space(2) }}>
        <Text style={styles.level}>Level {level.level}</Text>
        <ProgressBar value={level.progress} color={theme.colors.xp} />
        <View style={styles.summaryRow}>
          <Summary value={`${progress.xp}`} label="total XP" />
          <Summary value={`${progress.streak}`} label="streak" />
          <Summary value={`${completedLessons.length}`} label="lessons" />
          <Summary value={`${owned.size}`} label="badges" />
        </View>
      </Card>

      <Text style={styles.h2}>Badges</Text>
      <View style={styles.badgeGrid}>
        {BADGES.map((b) => {
          const has = owned.has(b.id);
          return (
            <Card key={b.id} style={[styles.badge, !has && styles.locked]}>
              <Text style={[styles.badgeEmoji, !has && { opacity: 0.3 }]}>
                {has ? b.emoji : "🔒"}
              </Text>
              <Text style={styles.badgeLabel}>{b.label}</Text>
              <Text style={styles.badgeDesc}>{b.description}</Text>
            </Card>
          );
        })}
      </View>

      <View style={{ marginTop: theme.space(4) }}>
        <Button label="Reset progress" variant="ghost" onPress={confirmReset} />
      </View>
    </ScrollView>
  );
}

function Summary({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4), gap: theme.space(3), paddingBottom: 40 },
  h1: { fontSize: 26, fontWeight: "800", color: theme.colors.text },
  h2: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: theme.space(2),
  },
  level: { fontSize: 22, fontWeight: "800", color: theme.colors.text },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.space(2),
  },
  summary: { alignItems: "center", flex: 1 },
  summaryValue: { fontSize: 20, fontWeight: "800", color: theme.colors.text },
  summaryLabel: { fontSize: 11, color: theme.colors.subtext, marginTop: 2 },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.space(2.5) },
  badge: { width: "47%", alignItems: "center", gap: theme.space(1) },
  locked: { opacity: 0.7 },
  badgeEmoji: { fontSize: 34 },
  badgeLabel: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
  badgeDesc: {
    fontSize: 11,
    color: theme.colors.subtext,
    textAlign: "center",
    lineHeight: 15,
  },
});
