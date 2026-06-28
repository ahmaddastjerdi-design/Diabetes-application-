/**
 * OnboardingScreen.tsx — first-run personalization.
 *
 * Collects name, condition, current medications, and a self-chosen daily step
 * goal, then optionally connects Health Connect. Personalization + autonomy are
 * evidence-based engagement levers (see DESIGN.md).
 */
import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGame } from "../state/GameContext";
import {
  CONDITIONS,
  ConditionId,
  MEDICATIONS,
  STEP_GOAL_OPTIONS,
  UserProfile,
  defaultProfile,
} from "../data/profile";
import { useHealthConnect } from "../services/useHealthConnect";
import { Card, Button, ProgressBar } from "../components/ui";
import { theme } from "../theme";

const STEPS = ["name", "condition", "meds", "goal", "connect"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingScreen() {
  const { saveProfile } = useGame();
  const [stepIdx, setStepIdx] = useState(0);
  const [draft, setDraft] = useState<UserProfile>(defaultProfile);
  const hc = useHealthConnect();

  const step: Step = STEPS[stepIdx];
  const next = () => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  const back = () => setStepIdx((i) => Math.max(0, i - 1));
  const finish = () => saveProfile(draft);

  const toggleMed = (id: string) =>
    setDraft((d) => ({
      ...d,
      medications: d.medications.includes(id)
        ? d.medications.filter((m) => m !== id)
        : [...d.medications, id],
    }));

  const canContinue = step === "name" ? draft.name.trim().length > 0 : true;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>🩺 Diabetes Quest</Text>
        <ProgressBar
          value={(stepIdx + 1) / STEPS.length}
          color={theme.colors.primary}
        />

        {step === "name" && (
          <Card style={styles.card}>
            <Text style={styles.h}>Welcome! What should we call you?</Text>
            <Text style={styles.sub}>
              We'll personalize your journey. Nothing leaves your device.
            </Text>
            <TextInput
              value={draft.name}
              onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
              placeholder="Your first name"
              placeholderTextColor={theme.colors.subtext}
              style={styles.input}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => canContinue && next()}
            />
          </Card>
        )}

        {step === "condition" && (
          <Card style={styles.card}>
            <Text style={styles.h}>Which best describes you?</Text>
            {CONDITIONS.map((c) => {
              const sel = draft.condition === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() =>
                    setDraft((d) => ({ ...d, condition: c.id as ConditionId }))
                  }
                  style={[styles.choice, sel && styles.choiceSel]}
                >
                  <Text style={styles.choiceEmoji}>{c.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.choiceLabel}>{c.label}</Text>
                    <Text style={styles.choiceBlurb}>{c.blurb}</Text>
                  </View>
                  <Text style={styles.radio}>{sel ? "🔘" : "⚪"}</Text>
                </Pressable>
              );
            })}
          </Card>
        )}

        {step === "meds" && (
          <Card style={styles.card}>
            <Text style={styles.h}>Which medicines do you take?</Text>
            <Text style={styles.sub}>
              Pick any that apply — we'll tailor your daily logging. You can
              change this later.
            </Text>
            {MEDICATIONS.map((m) => {
              const sel = draft.medications.includes(m.id);
              return (
                <Pressable
                  key={m.id}
                  onPress={() => toggleMed(m.id)}
                  style={[styles.choice, sel && styles.choiceSel]}
                >
                  <Text style={styles.choiceEmoji}>{m.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.choiceLabel}>{m.label}</Text>
                    <Text style={styles.choiceBlurb}>controls {m.controls}</Text>
                  </View>
                  <Text style={styles.radio}>{sel ? "☑️" : "⬜"}</Text>
                </Pressable>
              );
            })}
          </Card>
        )}

        {step === "goal" && (
          <Card style={styles.card}>
            <Text style={styles.h}>Set your daily step goal</Text>
            <Text style={styles.sub}>You choose — pick what feels right.</Text>
            <View style={styles.goalRow}>
              {STEP_GOAL_OPTIONS.map((g) => {
                const sel = draft.stepGoal === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => setDraft((d) => ({ ...d, stepGoal: g }))}
                    style={[styles.goalChip, sel && styles.goalChipSel]}
                  >
                    <Text style={[styles.goalText, sel && { color: "#fff" }]}>
                      {g.toLocaleString()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        )}

        {step === "connect" && (
          <Card style={styles.card}>
            <Text style={styles.h}>Connect your steps (optional)</Text>
            <Text style={styles.sub}>
              Link Android Health Connect so real steps feed your journey
              automatically. You can always do this later from the Home screen.
            </Text>
            <HealthConnectInline hc={hc} />
          </Card>
        )}

        <View style={styles.nav}>
          <View style={{ flex: 1 }}>
            {stepIdx > 0 && (
              <Button label="Back" variant="ghost" onPress={back} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            {step === "connect" ? (
              <Button label={`Start, ${draft.name.trim()}!`} onPress={finish} />
            ) : (
              <Button label="Continue" onPress={next} disabled={!canContinue} />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Compact connect control reused on the onboarding "connect" step. */
function HealthConnectInline({
  hc,
}: {
  hc: ReturnType<typeof useHealthConnect>;
}) {
  if (hc.status === "unsupported-platform") {
    return (
      <Text style={styles.note}>
        📱 Step syncing works on Android with a development build. You're all set
        to continue without it.
      </Text>
    );
  }
  if (hc.status === "unavailable" || hc.status === "update-required") {
    return (
      <Text style={styles.note}>
        Health Connect isn't ready on this device yet. You can connect later.
      </Text>
    );
  }
  if (hc.connected) {
    return (
      <Text style={[styles.note, { color: theme.colors.good }]}>
        ✅ Connected{hc.steps != null ? ` — ${hc.steps.toLocaleString()} steps today` : ""}!
      </Text>
    );
  }
  return (
    <Button
      label={hc.busy ? "Connecting…" : "Connect Health Connect"}
      onPress={hc.connect}
      disabled={hc.busy}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4), gap: theme.space(4), paddingBottom: 32 },
  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "center",
  },
  card: { gap: theme.space(3) },
  h: { fontSize: 20, fontWeight: "800", color: theme.colors.text },
  sub: { fontSize: 14, color: theme.colors.subtext, lineHeight: 20 },
  input: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: "#fff",
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.space(3),
    backgroundColor: "#fff",
  },
  choiceSel: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + "10",
  },
  choiceEmoji: { fontSize: 26 },
  choiceLabel: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  choiceBlurb: { fontSize: 12, color: theme.colors.subtext, marginTop: 2 },
  radio: { fontSize: 18 },
  goalRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.space(2.5) },
  goalChip: {
    paddingVertical: theme.space(3),
    paddingHorizontal: theme.space(4),
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
  },
  goalChipSel: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  goalText: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  note: { fontSize: 13, color: theme.colors.subtext, lineHeight: 19 },
  nav: {
    flexDirection: "row",
    gap: theme.space(3),
    alignItems: "center",
  },
});
