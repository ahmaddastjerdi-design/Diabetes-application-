/** OrganCard.tsx — visualises one organ's health, the heart of the "aesthetic". */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { OrganDef, organStatus } from "../engine/physiology";
import { Card, ProgressBar, Pill } from "./ui";
import { theme } from "../theme";

export function OrganCard({
  organ,
  score,
  delta,
}: {
  organ: OrganDef;
  score: number;
  delta?: number;
}) {
  const status = organStatus(score);
  return (
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
            <Text style={[styles.score, { color: status.color }]}>
              {Math.round(score)}
            </Text>
            <Pill label={status.label} color={status.color} />
          </View>
        </View>
      </View>
      <ProgressBar value={score / 100} color={status.color} height={12} />
      <Text style={styles.blurb}>{organ.blurb}</Text>
    </Card>
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
});
