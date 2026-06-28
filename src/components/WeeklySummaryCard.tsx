/**
 * WeeklySummaryCard.tsx — a short "last 7 days" recap to reinforce progress.
 * Shows organ-health change over the window, current streak, and the A1c trend.
 * Hidden until there's enough history to say something meaningful.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useGame } from "../state/GameContext";
import { BodyState, estimatedA1c } from "../engine/physiology";
import { Card } from "./ui";
import { theme } from "../theme";

function round(n: number) {
  return Math.round(n * 10) / 10;
}

export function WeeklySummaryCard({ body }: { body: BodyState }) {
  const { progress } = useGame();
  const h = body.history ?? [];
  if (h.length < 3) return null; // not enough to summarise yet

  const N = Math.min(7, h.length - 1);
  const cur = h[h.length - 1];
  const past = h[h.length - 1 - N];
  const heartD = round(cur.heart - past.heart);
  const kidneyD = round(cur.kidney - past.kidney);

  const recent = h.slice(-N).map((x) => x.glucose);
  const prior = h.slice(-2 * N, -N).map((x) => x.glucose);
  const a1cNow = estimatedA1c(recent);
  const a1cPrev = prior.length ? estimatedA1c(prior) : null;
  const a1cD = a1cNow != null && a1cPrev != null ? round(a1cNow - a1cPrev) : null;

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Your last {N} days</Text>

      <Row emoji="❤️" label="Heart" delta={heartD} goodWhenUp />
      <Row emoji="🫘" label="Kidneys" delta={kidneyD} goodWhenUp />
      {a1cD != null && (
        <Row emoji="🩸" label="Estimated A1c" delta={a1cD} suffix="%" goodWhenUp={false} />
      )}
      <View style={styles.streakRow}>
        <Text style={styles.streakText}>🔥 {progress.streak}-day streak</Text>
      </View>
    </Card>
  );
}

function Row({
  emoji,
  label,
  delta,
  suffix = "",
  goodWhenUp,
}: {
  emoji: string;
  label: string;
  delta: number;
  suffix?: string;
  goodWhenUp: boolean;
}) {
  const flat = delta === 0;
  const isGood = goodWhenUp ? delta > 0 : delta < 0;
  const color = flat
    ? theme.colors.subtext
    : isGood
    ? theme.colors.good
    : theme.colors.bad;
  const arrow = flat ? "→" : delta > 0 ? "▲" : "▼";
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>
        {emoji} {label}
      </Text>
      <Text style={[styles.rowDelta, { color }]}>
        {arrow} {delta > 0 ? "+" : ""}
        {delta}
        {suffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.space(2) },
  title: { fontSize: 17, fontWeight: "700", color: theme.colors.text },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
  rowDelta: { fontSize: 15, fontWeight: "800" },
  streakRow: { marginTop: theme.space(1) },
  streakText: { fontSize: 13, fontWeight: "700", color: theme.colors.warn },
});
