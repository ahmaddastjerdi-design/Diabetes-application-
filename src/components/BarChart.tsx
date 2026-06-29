/** BarChart.tsx — a dependency-free bar chart drawn with Views (no native chart lib). */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Bucket } from "../lib/trends";
import { theme } from "../theme";

export function BarChart({
  buckets,
  range,
  height = 110,
  colorFor,
}: {
  buckets: Bucket[];
  range: [number, number];
  height?: number;
  colorFor?: (v: number) => string;
}) {
  const [lo, hi] = range;
  const span = Math.max(1, hi - lo);
  const hasData = buckets.some((b) => b.value !== null);

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {buckets.map((b, i) => {
          const h = b.value == null ? 2 : Math.max(3, ((b.value - lo) / span) * height);
          const color = b.value == null ? theme.colors.border : colorFor ? colorFor(b.value) : theme.colors.primary;
          return <View key={i} style={{ flex: 1, height: h, backgroundColor: color, borderRadius: 3 }} />;
        })}
      </View>
      <View style={styles.axis}>
        {buckets.map((b, i) => (
          <Text key={i} style={styles.tick} numberOfLines={1}>
            {i % 3 === 0 ? b.label : ""}
          </Text>
        ))}
      </View>
      {!hasData && <Text style={styles.empty}>No readings yet for this period.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  axis: { flexDirection: "row", gap: 2, marginTop: 4 },
  tick: { flex: 1, fontSize: 8, textAlign: "center", color: theme.colors.subtext },
  empty: { fontSize: 12, color: theme.colors.subtext, marginTop: 6, textAlign: "center" },
});
