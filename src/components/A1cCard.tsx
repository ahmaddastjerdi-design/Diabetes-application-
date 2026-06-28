/**
 * A1cCard.tsx — the long-term control number. Estimated HbA1c is a slow average
 * of recent glucose, so it rewards *sustained* good habits rather than any
 * single day — the metric clinicians track.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BodyState, a1cStatus, estimatedA1c } from "../engine/physiology";
import { Card, Pill } from "./ui";
import { CountUp } from "./anim";
import { theme } from "../theme";

export function A1cCard({ body }: { body: BodyState }) {
  const glucose = (body.history ?? []).map((h) => h.glucose);
  const a1c = estimatedA1c(glucose);

  if (a1c == null) return null;
  const status = a1cStatus(a1c);

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Long-term control</Text>
          <Text style={styles.sub}>
            estimated A1c · {glucose.length} day
            {glucose.length === 1 ? "" : "s"}
          </Text>
        </View>
        <View style={styles.valueWrap}>
          <CountUp value={a1c} style={[styles.value, { color: status.color }]} />
          <Text style={[styles.pct, { color: status.color }]}>%</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Pill label={status.label} color={status.color} />
        <Text style={styles.target}>target under 7.0%</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.space(2) },
  row: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "700", color: theme.colors.text },
  sub: { fontSize: 12, color: theme.colors.subtext, marginTop: 2 },
  valueWrap: { flexDirection: "row", alignItems: "baseline" },
  value: { fontSize: 34, fontWeight: "800" },
  pct: { fontSize: 18, fontWeight: "800", marginLeft: 2 },
  footer: { flexDirection: "row", alignItems: "center", gap: theme.space(3) },
  target: { fontSize: 12, color: theme.colors.subtext },
});
