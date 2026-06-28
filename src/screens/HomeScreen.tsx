/** HomeScreen.tsx — the dashboard: level, streak, organs, and live markers. */
import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useGame } from "../state/GameContext";
import { MARKERS, MarkerKey, ORGANS, OrganKey } from "../engine/physiology";
import { levelFromXp, xpForLevel } from "../engine/gamification";
import { OrganCard } from "../components/OrganCard";
import { MarkerRow } from "../components/MarkerRow";
import { Card, ProgressBar } from "../components/ui";
import { theme } from "../theme";

export function HomeScreen() {
  const { body, progress, level, inRangeCount } = useGame();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.h1}>Your body today</Text>
      <Text style={styles.subtitle}>Day {body.day} of your journey</Text>

      {/* Level + streak header */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statBig}>Lv {level.level}</Text>
            <Text style={styles.statLabel}>{progress.xp} XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statBig}>🔥 {progress.streak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statBig}>
              {inRangeCount}/{Object.keys(MARKERS).length}
            </Text>
            <Text style={styles.statLabel}>in range</Text>
          </View>
        </View>
        <View style={{ marginTop: theme.space(3) }}>
          <ProgressBar value={level.progress} color={theme.colors.xp} />
          <Text style={styles.xpHint}>
            {Math.max(0, xpForLevel(level.level) - progress.xp)} XP to level{" "}
            {level.level + 1}
          </Text>
        </View>
      </Card>

      {/* Organs */}
      <Text style={styles.h2}>Your organs</Text>
      {(Object.keys(ORGANS) as OrganKey[]).map((k) => (
        <OrganCard key={k} organ={ORGANS[k]} score={body.organs[k]} />
      ))}

      {/* Markers */}
      <Text style={styles.h2}>Live markers</Text>
      <Card>
        {(Object.keys(MARKERS) as MarkerKey[]).map((k, i) => (
          <View key={k}>
            {i > 0 && <View style={styles.sep} />}
            <MarkerRow def={MARKERS[k]} value={body.markers[k]} />
          </View>
        ))}
      </Card>

      <Text style={styles.disclaimer}>
        ⚕️ This is an educational simulation, not medical advice. Always follow
        your own care team's guidance.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4), gap: theme.space(3), paddingBottom: 40 },
  h1: { fontSize: 26, fontWeight: "800", color: theme.colors.text },
  subtitle: { fontSize: 14, color: theme.colors.subtext, marginTop: -8 },
  h2: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: theme.space(2),
  },
  statsCard: { marginTop: theme.space(1) },
  statsRow: { flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, alignItems: "center" },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.border,
  },
  statBig: { fontSize: 20, fontWeight: "800", color: theme.colors.text },
  statLabel: { fontSize: 12, color: theme.colors.subtext, marginTop: 2 },
  xpHint: {
    fontSize: 11,
    color: theme.colors.subtext,
    marginTop: theme.space(1.5),
    textAlign: "right",
  },
  sep: { height: 1, backgroundColor: theme.colors.border },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.subtext,
    lineHeight: 17,
    marginTop: theme.space(3),
    textAlign: "center",
  },
});
