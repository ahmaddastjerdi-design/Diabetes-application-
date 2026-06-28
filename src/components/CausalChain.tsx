/**
 * CausalChain.tsx — animates the teaching moment behind a logged action:
 *   [your choice]  →  [markers it moved]  →  [organs it affected]
 * Each link fades in after the last, so the cause-and-effect reads as a flow.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MARKERS, MarkerKey, ORGANS, OrganKey } from "../engine/physiology";
import { ActionDef } from "../data/actions";
import { FadeIn } from "./anim";
import { theme } from "../theme";

/** Lower is better for most markers; hydration is the exception. */
function markerIsGood(key: MarkerKey, delta: number): boolean {
  const higherBetter = key === "hydration";
  return higherBetter ? delta > 0 : delta < 0;
}

export function CausalChain({
  action,
  organDelta,
}: {
  action: ActionDef;
  organDelta: Record<OrganKey, number>;
}) {
  const markerKeys = (Object.keys(action.effects) as MarkerKey[]).filter(
    (k) => (action.effects[k] ?? 0) !== 0
  );
  const organKeys = (Object.keys(organDelta) as OrganKey[]).filter(
    (k) => organDelta[k] !== 0
  );

  let step = 0;
  const d = () => 80 + step++ * 110;

  return (
    <View style={styles.row}>
      {/* Your choice */}
      <FadeIn delay={d()}>
        <View style={[styles.chip, styles.actionChip]}>
          <Text style={styles.chipText}>
            {action.emoji} {action.label}
          </Text>
        </View>
      </FadeIn>

      {markerKeys.length > 0 && (
        <FadeIn delay={d()}>
          <Text style={styles.arrow}>→</Text>
        </FadeIn>
      )}

      {/* Markers it moved */}
      {markerKeys.map((k) => {
        const delta = action.effects[k] ?? 0;
        const good = markerIsGood(k, delta);
        const color = good ? theme.colors.good : theme.colors.bad;
        return (
          <FadeIn key={k} delay={d()}>
            <View style={[styles.chip, { backgroundColor: color + "18" }]}>
              <Text style={[styles.chipText, { color }]}>
                {MARKERS[k].label.split(" ")[0]} {delta > 0 ? "↑" : "↓"}
              </Text>
            </View>
          </FadeIn>
        );
      })}

      {organKeys.length > 0 && (
        <FadeIn delay={d()}>
          <Text style={styles.arrow}>→</Text>
        </FadeIn>
      )}

      {/* Organs it affected */}
      {organKeys.map((k) => {
        const delta = organDelta[k];
        const color = delta > 0 ? theme.colors.good : theme.colors.bad;
        return (
          <FadeIn key={k} delay={d()}>
            <View style={[styles.chip, { backgroundColor: color + "18" }]}>
              <Text style={[styles.chipText, { color }]}>
                {ORGANS[k].emoji} {delta > 0 ? "+" : ""}
                {delta}
              </Text>
            </View>
          </FadeIn>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.space(1.5),
  },
  chip: {
    paddingHorizontal: theme.space(2.5),
    paddingVertical: theme.space(1.5),
    borderRadius: theme.radius.pill,
  },
  actionChip: { backgroundColor: theme.colors.primary + "18" },
  chipText: { fontSize: 13, fontWeight: "700", color: theme.colors.primary },
  arrow: { fontSize: 15, color: theme.colors.subtext, fontWeight: "700" },
});
