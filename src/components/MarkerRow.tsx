/** MarkerRow.tsx — shows one physiological marker, its value and range status. */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MarkerDef, markerStatus } from "../engine/physiology";
import { useGame } from "../state/GameContext";
import { formatMarker } from "../lib/units";
import { Pill } from "./ui";
import { theme } from "../theme";

export function MarkerRow({
  def,
  value,
}: {
  def: MarkerDef;
  value: number;
}) {
  const { profile } = useGame();
  const status = markerStatus(def.key, value);
  const fmt = formatMarker(def, value, profile.glucoseUnit);
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{def.label}</Text>
        <Text style={styles.range}>
          target {fmt.low}–{fmt.high} {fmt.unit}
        </Text>
      </View>
      <Text style={styles.value}>
        {fmt.value}
        <Text style={styles.unit}> {fmt.unit}</Text>
      </Text>
      <Pill label={status.label} color={status.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(2),
    paddingVertical: theme.space(2.5),
  },
  label: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
  range: { fontSize: 11, color: theme.colors.subtext, marginTop: 2 },
  value: { fontSize: 16, fontWeight: "800", color: theme.colors.text },
  unit: { fontSize: 11, fontWeight: "600", color: theme.colors.subtext },
});
