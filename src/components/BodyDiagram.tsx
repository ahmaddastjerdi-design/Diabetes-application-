/**
 * BodyDiagram.tsx — the centerpiece: a simple body silhouette whose heart and
 * kidneys are tinted by their current health, with a gentle pulsing "heartbeat".
 *
 * This is the app's differentiator made visual — the patient sees their organs
 * respond to their choices on an actual body, not just a number.
 */
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  Pressable,
} from "react-native";
import Svg, { Path, Circle, G } from "react-native-svg";
import { ORGANS, OrganKey, organStatus } from "../engine/physiology";
import { Card } from "./ui";
import { theme } from "./../theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SILHOUETTE = "#dbe4ee";

export function BodyDiagram({
  organs,
  onSelectOrgan,
}: {
  organs: Record<OrganKey, number>;
  onSelectOrgan?: (k: OrganKey) => void;
}) {
  const heartColor = organStatus(organs.heart).color;
  const kidneyColor = organStatus(organs.kidney).color;

  // Heartbeat halo: a pulsing circle behind the heart.
  const beat = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((reduce) => {
        if (cancelled || reduce) return;
        Animated.loop(
          Animated.sequence([
            Animated.timing(beat, {
              toValue: 1,
              duration: 850,
              useNativeDriver: false,
            }),
            Animated.timing(beat, {
              toValue: 0,
              duration: 850,
              useNativeDriver: false,
            }),
          ])
        ).start();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [beat]);

  const haloR = beat.interpolate({ inputRange: [0, 1], outputRange: [13, 24] });
  const haloO = beat.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  const a11yLabel = `Your body. Heart ${Math.round(
    organs.heart
  )} of 100, ${organStatus(organs.heart).label}. Kidneys ${Math.round(
    organs.kidney
  )} of 100, ${organStatus(organs.kidney).label}.`;

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Your body</Text>
      <View
        style={styles.svgWrap}
        accessible
        accessibilityLabel={a11yLabel}
      >
        <Svg
          width="100%"
          height={240}
          viewBox="0 0 200 250"
          accessibilityRole="image"
        >
          {/* Silhouette */}
          <Circle cx={100} cy={30} r={22} fill={SILHOUETTE} />
          <Path
            d="M70,60 Q100,51 130,60 L139,122 Q141,146 126,172 L74,172 Q59,146 61,122 Z"
            fill={SILHOUETTE}
          />
          {/* Arms */}
          <Path d="M70,64 L50,72 L57,150 L70,146 Z" fill={SILHOUETTE} />
          <Path d="M130,64 L150,72 L143,150 L130,146 Z" fill={SILHOUETTE} />
          {/* Legs */}
          <Path d="M76,172 L70,244 L92,244 L97,174 Z" fill={SILHOUETTE} />
          <Path d="M124,172 L130,244 L108,244 L103,174 Z" fill={SILHOUETTE} />

          {/* Heartbeat halo + heart */}
          <AnimatedCircle cx={96} cy={94} r={haloR} fill={heartColor} opacity={haloO} />
          <G transform="translate(96,92) scale(0.62)">
            <Path
              d="M0,-4 C-6,-15 -23,-11 -23,3 C-23,17 -7,23 0,31 C7,23 23,17 23,3 C23,-11 6,-15 0,-4 Z"
              fill={heartColor}
            />
          </G>

          {/* Kidneys */}
          <G transform="translate(85,128)">
            <Path
              d="M-1,-12 C7,-13 12,-4 9,5 C7,12 -1,13 -5,9 C-11,4 -9,-11 -1,-12 Z"
              fill={kidneyColor}
            />
          </G>
          <G transform="translate(115,128) scale(-1,1)">
            <Path
              d="M-1,-12 C7,-13 12,-4 9,5 C7,12 -1,13 -5,9 C-11,4 -9,-11 -1,-12 Z"
              fill={kidneyColor}
            />
          </G>
        </Svg>
      </View>

      {/* Legend (tap to open organ detail) */}
      <View style={styles.legend}>
        {(["heart", "kidney"] as OrganKey[]).map((k) => {
          const s = organStatus(organs[k]);
          return (
            <Pressable
              key={k}
              onPress={() => onSelectOrgan?.(k)}
              disabled={!onSelectOrgan}
              accessibilityRole="button"
              accessibilityLabel={`${ORGANS[k].label}: ${Math.round(
                organs[k]
              )} of 100, ${s.label}. Tap for details.`}
              style={({ pressed }) => [
                styles.legendItem,
                pressed && onSelectOrgan ? { opacity: 0.6 } : null,
              ]}
            >
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <Text style={styles.legendLabel}>
                {ORGANS[k].emoji} {ORGANS[k].label}
              </Text>
              <Text style={[styles.legendStatus, { color: s.color }]}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.space(2), alignItems: "stretch" },
  title: { fontSize: 17, fontWeight: "700", color: theme.colors.text },
  svgWrap: { alignItems: "center", justifyContent: "center" },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: theme.space(1),
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: theme.space(1.5) },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 13, fontWeight: "600", color: theme.colors.text },
  legendStatus: { fontSize: 13, fontWeight: "700" },
});
