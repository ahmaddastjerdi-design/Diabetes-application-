/** LogScreen.tsx — the core mechanic: log a daily action and see the impact. */
import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { useGame } from "../state/GameContext";
import {
  ACTIONS_BY_CATEGORY,
  CATEGORY_META,
  ActionCategory,
  ActionDef,
} from "../data/actions";
import { OrganKey, ORGANS } from "../engine/physiology";
import { BadgeDef } from "../engine/gamification";
import { Card } from "../components/ui";
import { theme } from "../theme";

interface Feedback {
  action: ActionDef;
  organDelta: Record<OrganKey, number>;
  xpGained: number;
  newBadges: BadgeDef[];
}

export function LogScreen() {
  const { logAction, profile } = useGame();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const onLog = (action: ActionDef) => {
    const res = logAction(action);
    setFeedback({ action, ...res });
  };

  // Personalize the medication tiles to the patient's own meds. "Missed my
  // medicine" only makes sense if they take any. Other categories are unchanged.
  const actionsFor = (cat: ActionCategory): ActionDef[] => {
    if (cat !== "drug") return ACTIONS_BY_CATEGORY[cat];
    if (profile.medications.length === 0) return ACTIONS_BY_CATEGORY[cat];
    return ACTIONS_BY_CATEGORY.drug.filter(
      (a) => profile.medications.includes(a.id) || a.id === "missed-meds"
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.h1}>Log a choice</Text>
      <Text style={styles.subtitle}>
        Tap something you did. Watch how it ripples through your body.
      </Text>

      {feedback && <FeedbackCard fb={feedback} />}

      {(Object.keys(ACTIONS_BY_CATEGORY) as ActionCategory[]).map((cat) => (
        <View key={cat} style={{ gap: theme.space(2) }}>
          <Text style={styles.h2}>
            {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
          </Text>
          <View style={styles.grid}>
            {actionsFor(cat).map((a) => (
              <Pressable
                key={a.id}
                onPress={() => onLog(a)}
                style={({ pressed }) => [
                  styles.tile,
                  pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
                ]}
              >
                <Text style={styles.tileEmoji}>{a.emoji}</Text>
                <Text style={styles.tileLabel}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function FeedbackCard({ fb }: { fb: Feedback }) {
  return (
    <Card style={styles.feedback}>
      <Text style={styles.feedbackTitle}>
        {fb.action.emoji} {fb.action.label}
      </Text>
      <Text style={styles.teach}>{fb.action.teach}</Text>

      <View style={styles.deltaRow}>
        {(Object.keys(fb.organDelta) as OrganKey[]).map((k) => {
          const d = fb.organDelta[k];
          if (d === 0) return null;
          return (
            <Text
              key={k}
              style={[
                styles.deltaChip,
                {
                  color: d > 0 ? theme.colors.good : theme.colors.bad,
                  backgroundColor:
                    (d > 0 ? theme.colors.good : theme.colors.bad) + "18",
                },
              ]}
            >
              {ORGANS[k].emoji} {d > 0 ? "+" : ""}
              {d}
            </Text>
          );
        })}
        <Text style={styles.xpChip}>+{fb.xpGained} XP</Text>
      </View>

      {fb.newBadges.map((b) => (
        <Text key={b.id} style={styles.badgeUnlock}>
          {b.emoji} Badge unlocked: {b.label}!
        </Text>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4), gap: theme.space(4), paddingBottom: 40 },
  h1: { fontSize: 26, fontWeight: "800", color: theme.colors.text },
  subtitle: { fontSize: 14, color: theme.colors.subtext, marginTop: -8 },
  h2: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.space(2.5) },
  tile: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.space(3.5),
    paddingHorizontal: theme.space(2),
    alignItems: "center",
    width: "31%",
    ...theme.shadow,
  },
  tileEmoji: { fontSize: 30 },
  tileLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.text,
    textAlign: "center",
    marginTop: theme.space(1.5),
  },
  feedback: {
    backgroundColor: "#eff6ff",
    borderColor: theme.colors.primary + "55",
    gap: theme.space(2),
  },
  feedbackTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.text },
  teach: { fontSize: 13, color: theme.colors.text, lineHeight: 19 },
  deltaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.space(2),
    alignItems: "center",
    marginTop: theme.space(1),
  },
  deltaChip: {
    fontSize: 14,
    fontWeight: "800",
    paddingHorizontal: theme.space(2.5),
    paddingVertical: theme.space(1),
    borderRadius: theme.radius.pill,
    overflow: "hidden",
  },
  xpChip: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.xp,
    backgroundColor: theme.colors.xp + "18",
    paddingHorizontal: theme.space(2.5),
    paddingVertical: theme.space(1),
    borderRadius: theme.radius.pill,
    overflow: "hidden",
  },
  badgeUnlock: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primaryDark,
    marginTop: theme.space(1),
  },
});
