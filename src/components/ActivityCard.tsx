/**
 * ActivityCard.tsx — surfaces real Health Connect steps and lets the patient
 * apply them to their simulated day. Degrades gracefully when Health Connect is
 * unavailable (e.g. in Expo Go, on web, or before a dev build).
 */
import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useGame } from "../state/GameContext";
import { useHealthConnect } from "../services/useHealthConnect";
import { Card, Button, ProgressBar } from "./ui";
import { theme } from "../theme";

export function ActivityCard() {
  const { profile, logSteps, stepsSyncedToday } = useGame();
  const hc = useHealthConnect();
  const [applied, setApplied] = useState<string | null>(null);

  const goal = profile.stepGoal || 6000;
  const steps = hc.steps ?? 0;

  const onApply = () => {
    if (hc.steps == null) return;
    const res = logSteps(hc.steps);
    if (res) setApplied(`+${res.xpGained} XP from ${hc.steps.toLocaleString()} steps 👟`);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>👟 Today's activity</Text>
        {hc.status === "available" && !hc.connected && (
          <Text style={styles.tag}>not connected</Text>
        )}
      </View>

      {/* Unavailable states */}
      {hc.status !== "available" && (
        <Text style={styles.note}>
          {hc.status === "unsupported-platform"
            ? "Connect real steps on Android (development build) to power your journey with live data."
            : "Health Connect isn't ready on this device yet. Install/update it from the Play Store to sync steps."}
        </Text>
      )}

      {/* Available but not yet connected */}
      {hc.status === "available" && !hc.connected && (
        <Button
          label={hc.busy ? "Connecting…" : "Connect Health Connect"}
          onPress={hc.connect}
          disabled={hc.busy}
        />
      )}

      {/* Connected */}
      {hc.connected && (
        <>
          <View style={styles.stepsRow}>
            <Text style={styles.steps}>{steps.toLocaleString()}</Text>
            <Text style={styles.goal}>/ {goal.toLocaleString()} steps</Text>
          </View>
          <ProgressBar value={steps / goal} color={theme.colors.good} />
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button label="Refresh" variant="ghost" onPress={hc.refresh} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={stepsSyncedToday ? "Synced ✓" : "Apply to today"}
                onPress={onApply}
                disabled={stepsSyncedToday || hc.steps == null}
              />
            </View>
          </View>
          {applied && <Text style={styles.applied}>{applied}</Text>}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.space(3) },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 17, fontWeight: "700", color: theme.colors.text },
  tag: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.warn,
    backgroundColor: theme.colors.warn + "1a",
    paddingHorizontal: theme.space(2),
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
    overflow: "hidden",
  },
  note: { fontSize: 13, color: theme.colors.subtext, lineHeight: 19 },
  stepsRow: { flexDirection: "row", alignItems: "baseline", gap: theme.space(2) },
  steps: { fontSize: 32, fontWeight: "800", color: theme.colors.text },
  goal: { fontSize: 14, color: theme.colors.subtext },
  actions: { flexDirection: "row", gap: theme.space(3) },
  applied: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.good,
    textAlign: "center",
  },
});
