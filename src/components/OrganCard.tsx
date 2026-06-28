/** OrganCard.tsx — visualises one organ's health, the heart of the "aesthetic". */
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { OrganDef, organStatus } from "../engine/physiology";
import { Card, ProgressBar, Pill } from "./ui";
import { CountUp } from "./anim";
import { theme } from "../theme";

export function OrganCard({
  organ,
  score,
  delta,
  onPress,
}: {
  organ: OrganDef;
  score: number;
  delta?: number;
  onPress?: () => void;
}) {
  const status = organStatus(score);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${organ.label}: ${Math.round(score)} of 100, ${
        status.label
      }${onPress ? ". Tap for trend and tips." : ""}`}
      style={({ pressed }) => (pressed && onPress ? { opacity: 0.85 } : null)}
    >
    <Card style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{organ.emoji}</Text>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{organ.label}</Text>
            {delta !== undefined && delta !== 0 && (
              <Text
                style={[
                  styles.delta,
                  { color: delta > 0 ? theme.colors.good : theme.colors.bad },
                ]}
              >
                {delta > 0 ? "+" : ""}
                {delta}
              </Text>
            )}
          </View>
          <View style={styles.scoreRow}>
            <CountUp value={score} style={[styles.score, { color: status.color }]} />
            <Pill label={status.label} color={status.color} />
          </View>
        </View>
      </View>
      <ProgressBar value={score / 100} color={status.color} height={12} />
      <Text style={styles.blurb}>{organ.blurb}</Text>
      {onPress && <Text style={styles.cta}>Tap for trend & tips ›</Text>}
    </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.space(3) },
  row: { flexDirection: "row", alignItems: "center", gap: theme.space(3) },
  emoji: { fontSize: 40 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 17, fontWeight: "700", color: theme.colors.text },
  delta: { fontSize: 15, fontWeight: "800" },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(2),
    marginTop: theme.space(1),
  },
  score: { fontSize: 26, fontWeight: "800" },
  blurb: { fontSize: 13, color: theme.colors.subtext, lineHeight: 18 },
  cta: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
    marginTop: -theme.space(1),
  },
});
