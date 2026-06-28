/** LogScreen.tsx — the core mechanic: log a daily action and see the impact. */
import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGame } from "../state/GameContext";
import {
  ACTIONS_BY_CATEGORY,
  CATEGORY_META,
  ActionCategory,
  ActionDef,
  readingToAction,
} from "../data/actions";
import { OrganKey, MarkerKey, MARKERS } from "../engine/physiology";
import { BadgeDef } from "../engine/gamification";
import { Card, Button } from "../components/ui";
import { Pop } from "../components/anim";
import { CausalChain } from "../components/CausalChain";
import { useReward } from "../components/RewardLayer";
import * as H from "../services/haptics";
import { theme } from "../theme";

interface Feedback {
  action: ActionDef;
  organDelta: Record<OrganKey, number>;
  xpGained: number;
  newBadges: BadgeDef[];
}

export function LogScreen() {
  const { logAction, profile } = useGame();
  const { celebrate } = useReward();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [popKey, setPopKey] = useState(0);
  const [glucoseInput, setGlucoseInput] = useState("");
  const [bpInput, setBpInput] = useState("");

  const onLog = (action: ActionDef) => {
    const res = logAction(action);
    setFeedback({ action, ...res });
    setPopKey((k) => k + 1);

    // Tactile feedback reflects whether the choice helped or hurt.
    const net = (Object.values(res.organDelta) as number[]).reduce(
      (a, b) => a + b,
      0
    );
    if (net >= 0) H.notifySuccess();
    else H.notifyWarning();

    // XP toast + badge / level-up celebration.
    celebrate(res);
  };

  // Log a typed-in measurement (glucose / blood pressure).
  const onLogReading = (marker: MarkerKey, raw: string, clear: () => void) => {
    const value = parseInt(raw, 10);
    const [lo, hi] = MARKERS[marker].clamp;
    if (!Number.isFinite(value) || value < lo || value > hi) {
      H.notifyWarning();
      return; // ignore empty / out-of-bounds input
    }
    onLog(readingToAction(marker, value));
    clear();
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
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.h1}>Log a choice</Text>
      <Text style={styles.subtitle}>
        Tap something you did. Watch how it ripples through your body.
      </Text>

      {feedback && (
        <Pop trigger={popKey}>
          <FeedbackCard key={popKey} fb={feedback} />
        </Pop>
      )}

      {/* Enter measured readings */}
      <Card style={styles.readings}>
        <Text style={styles.readingsTitle}>📋 Enter a reading</Text>
        <Text style={styles.readingsHint}>
          Type a measured value from your glucometer or BP cuff.
        </Text>
        <ReadingRow
          label="Blood sugar"
          unit="mg/dL"
          value={glucoseInput}
          onChange={setGlucoseInput}
          onSave={() =>
            onLogReading("glucose", glucoseInput, () => setGlucoseInput(""))
          }
        />
        <ReadingRow
          label="Blood pressure"
          unit="mmHg (top number)"
          value={bpInput}
          onChange={setBpInput}
          onSave={() => onLogReading("systolic", bpInput, () => setBpInput(""))}
        />
      </Card>

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
                accessibilityRole="button"
                accessibilityLabel={`Log: ${a.label}`}
                accessibilityHint="Records this choice and shows its effect on your body"
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
    </SafeAreaView>
  );
}

function ReadingRow({
  label,
  unit,
  value,
  onChange,
  onSave,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (t: string) => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.readingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.readingLabel}>{label}</Text>
        <Text style={styles.readingUnit}>{unit}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        placeholder="–"
        placeholderTextColor={theme.colors.subtext}
        style={styles.readingInput}
        maxLength={3}
        accessibilityLabel={`${label} value`}
      />
      <View style={styles.readingBtn}>
        <Button label="Log" onPress={onSave} disabled={value.length === 0} />
      </View>
    </View>
  );
}

function FeedbackCard({ fb }: { fb: Feedback }) {
  return (
    <Card style={styles.feedback}>
      <Text style={styles.feedbackTitle}>{fb.action.teach}</Text>

      {/* Animated choice → markers → organs flow */}
      <CausalChain action={fb.action} organDelta={fb.organDelta} />

      <Text style={styles.xpChip}>+{fb.xpGained} XP</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4), gap: theme.space(4), paddingBottom: 40 },
  h1: { fontSize: 26, fontWeight: "800", color: theme.colors.text },
  subtitle: { fontSize: 14, color: theme.colors.subtext, marginTop: -8 },
  h2: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  readings: { gap: theme.space(2) },
  readingsTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  readingsHint: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: -theme.space(1),
  },
  readingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(2.5),
  },
  readingLabel: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
  readingUnit: { fontSize: 11, color: theme.colors.subtext, marginTop: 1 },
  readingInput: {
    width: 64,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space(2),
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    backgroundColor: "#fff",
  },
  readingBtn: { width: 84 },
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
