/**
 * OrganDetailSheet.tsx — a bottom sheet that opens when you tap an organ.
 * Shows the organ's health trend, what's affecting it right now, and concrete
 * tips for the markers that are out of range.
 */
import React, { useEffect, useRef } from "react";
import {
  Modal,
  Pressable,
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BodyState,
  MARKERS,
  OrganKey,
  ORGANS,
  organInsights,
  organStatus,
} from "../engine/physiology";
import { Sparkline } from "./Sparkline";
import { Pill } from "./ui";
import { theme } from "../theme";

export function OrganDetailSheet({
  organKey,
  body,
  onClose,
}: {
  organKey: OrganKey | null;
  body: BodyState;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;
  const visible = organKey !== null;

  useEffect(() => {
    if (visible) {
      slide.setValue(0);
      Animated.spring(slide, {
        toValue: 1,
        useNativeDriver: true,
        friction: 9,
        tension: 70,
      }).start();
    }
  }, [visible, slide]);

  if (!organKey) {
    return <Modal visible={false} transparent onRequestClose={onClose} />;
  }

  const organ = ORGANS[organKey];
  const score = body.organs[organKey];
  const status = organStatus(score);
  const insights = organInsights(organKey, body.markers);
  const history = (body.history ?? []).map((h) => h[organKey]);

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Backdrop is a sibling *behind* the sheet, so tapping the sheet (or
            scrolling inside it) never closes — only tapping the dimmed area. */}
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + theme.space(5), transform: [{ translateY }] },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.emoji}>{organ.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{organ.label}</Text>
              <View style={styles.scoreRow}>
                <Text style={[styles.score, { color: status.color }]}>
                  {Math.round(score)}
                </Text>
                <Pill label={status.label} color={status.color} />
              </View>
            </View>
          </View>

          <Text style={styles.blurb}>{organ.blurb}</Text>

          <ScrollView
            style={{ maxHeight: 320 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Trend */}
            <Text style={styles.section}>
              Health trend · last {history.length} day
              {history.length === 1 ? "" : "s"}
            </Text>
            <View style={styles.chartCard}>
              <Sparkline data={history} color={status.color} />
            </View>

            {/* What's affecting it */}
            <Text style={styles.section}>What's affecting it now</Text>
            {insights.map((ins) => (
              <View key={ins.marker} style={styles.insightRow}>
                <View style={styles.insightTop}>
                  <Text style={styles.insightLabel}>
                    {MARKERS[ins.marker].label}
                  </Text>
                  <Pill label={ins.status.label} color={ins.status.color} />
                </View>
                {!ins.inRange && <Text style={styles.tip}>💡 {ins.tip}</Text>}
              </View>
            ))}

            {insights.every((i) => i.inRange) && (
              <Text style={styles.allGood}>
                ✅ Everything affecting your {organ.label.toLowerCase()} is in
                range. Keep it up!
              </Text>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15,23,42,0.5)",
  },
  sheet: {
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.space(5),
    gap: theme.space(2),
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    marginBottom: theme.space(2),
  },
  header: { flexDirection: "row", alignItems: "center", gap: theme.space(3) },
  emoji: { fontSize: 40 },
  title: { fontSize: 20, fontWeight: "800", color: theme.colors.text },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(2),
    marginTop: 2,
  },
  score: { fontSize: 24, fontWeight: "800" },
  blurb: {
    fontSize: 13,
    color: theme.colors.subtext,
    lineHeight: 19,
    marginBottom: theme.space(1),
  },
  section: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.subtext,
    marginTop: theme.space(3),
    marginBottom: theme.space(2),
  },
  chartCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space(2),
    alignItems: "center",
  },
  insightRow: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space(3),
    marginBottom: theme.space(2),
    gap: theme.space(1.5),
  },
  insightTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  insightLabel: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
  tip: { fontSize: 13, color: theme.colors.text, lineHeight: 18 },
  allGood: {
    fontSize: 13,
    color: theme.colors.good,
    fontWeight: "600",
    marginTop: theme.space(1),
    lineHeight: 19,
  },
});
