/**
 * OnboardingScreen.tsx — first-run onboarding & consent (PRD Vol 2: onboarding/consent).
 * A short stepper that personalizes the app (condition type, glucose unit) and captures
 * informed consent to the educational-only disclaimer before the app can be used.
 */
import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { useGame, ConditionType } from "../state/GameContext";
import { GlucoseUnit } from "../lib/units";
import { Card, Button } from "../components/ui";
import { theme } from "../theme";

const CONDITIONS: { key: ConditionType; label: string }[] = [
  { key: "type1", label: "Type 1" },
  { key: "type2", label: "Type 2" },
  { key: "prediabetes", label: "Prediabetes" },
  { key: "gestational", label: "Gestational" },
  { key: "other", label: "Other / not sure" },
];

export function OnboardingScreen() {
  const { completeOnboarding } = useGame();
  const [step, setStep] = useState(0);
  const [conditionType, setConditionType] = useState<ConditionType>("type2");
  const [glucoseUnit, setGlucoseUnit] = useState<GlucoseUnit>("mg/dL");
  const [consent, setConsent] = useState(false);

  const finish = () =>
    completeOnboarding({ consentAccepted: true, conditionType, glucoseUnit, remindersEnabled: true });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.brand}>Diabetes Quest 🩺</Text>

      {step === 0 && (
        <Card style={styles.card}>
          <Text style={styles.h1}>Welcome</Text>
          <Text style={styles.p}>
            Learn how your everyday choices around diet, exercise and medication ripple through
            your body — and watch your heart and kidneys respond.
          </Text>
          <Button label="Get started" onPress={() => setStep(1)} />
        </Card>
      )}

      {step === 1 && (
        <Card style={styles.card}>
          <Text style={styles.h1}>What brings you here?</Text>
          <Text style={styles.p}>This personalizes your lessons. You can change it later.</Text>
          {CONDITIONS.map((c) => (
            <Choice key={c.key} label={c.label} selected={conditionType === c.key} onPress={() => setConditionType(c.key)} />
          ))}
          <Button label="Continue" onPress={() => setStep(2)} />
        </Card>
      )}

      {step === 2 && (
        <Card style={styles.card}>
          <Text style={styles.h1}>Glucose units</Text>
          <Text style={styles.p}>Which unit do you use?</Text>
          <Choice label="mg/dL (US)" selected={glucoseUnit === "mg/dL"} onPress={() => setGlucoseUnit("mg/dL")} />
          <Choice label="mmol/L (most countries)" selected={glucoseUnit === "mmol/L"} onPress={() => setGlucoseUnit("mmol/L")} />
          <Button label="Continue" onPress={() => setStep(3)} />
        </Card>
      )}

      {step === 3 && (
        <Card style={styles.card}>
          <Text style={styles.h1}>Before you start</Text>
          <Text style={styles.p}>
            Diabetes Quest is an <Text style={styles.bold}>educational simulation</Text>. It is not
            medical advice, not a diagnosis, and not a medical device. Its model teaches the
            direction of cause and effect — it does not predict your real health. Always follow
            your own clinician for medical decisions.
          </Text>
          <Pressable style={styles.consentRow} onPress={() => setConsent((v) => !v)}>
            <View style={[styles.checkbox, consent && styles.checkboxOn]}>
              {consent && <Text style={styles.check}>✓</Text>}
            </View>
            <Text style={styles.consentText}>I understand and agree to use this app for learning.</Text>
          </Pressable>
          <Button label="Start my journey" onPress={finish} disabled={!consent} />
        </Card>
      )}

      <Text style={styles.dots}>{"●".repeat(step + 1)}{"○".repeat(3 - step)}</Text>
    </ScrollView>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceOn]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(5), gap: theme.space(4), paddingTop: theme.space(16), flexGrow: 1 },
  brand: { fontSize: 22, fontWeight: "800", color: theme.colors.primary, textAlign: "center" },
  card: { gap: theme.space(3) },
  h1: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  p: { fontSize: 14, color: theme.colors.subtext, lineHeight: 21 },
  bold: { fontWeight: "800", color: theme.colors.text },
  choice: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space(3),
    paddingHorizontal: theme.space(4),
  },
  choiceOn: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + "11" },
  choiceText: { fontSize: 15, fontWeight: "600", color: theme.colors.text },
  choiceTextOn: { color: theme.colors.primary },
  consentRow: { flexDirection: "row", alignItems: "center", gap: theme.space(3) },
  checkbox: {
    width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: theme.colors.border,
    alignItems: "center", justifyContent: "center",
  },
  checkboxOn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  check: { color: "#fff", fontWeight: "800" },
  consentText: { flex: 1, fontSize: 13, color: theme.colors.text },
  dots: { textAlign: "center", color: theme.colors.primary, letterSpacing: 4, marginTop: theme.space(2) },
});
