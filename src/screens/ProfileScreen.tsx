/** ProfileScreen.tsx — personalization, badges, level summary, and reset. */
import React from "react";
import { ScrollView, View, Text, StyleSheet, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGame } from "../state/GameContext";
import { BADGES } from "../engine/gamification";
import {
  CONDITIONS,
  MEDICATIONS,
  STEP_GOAL_OPTIONS,
  ConditionId,
} from "../data/profile";
import { Card, Button, ProgressBar } from "../components/ui";
import { FadeIn } from "../components/anim";
import { RemindersCard } from "../components/RemindersCard";
import { AchievementsCard } from "../components/AchievementsCard";
import * as H from "../services/haptics";
import { theme } from "../theme";

export function ProfileScreen() {
  const { progress, level, completedLessons, profile, updateProfile, reset } =
    useGame();
  const owned = new Set(progress.badges);

  const toggleMed = (id: string) => {
    H.tapLight();
    updateProfile({
      medications: profile.medications.includes(id)
        ? profile.medications.filter((m) => m !== id)
        : [...profile.medications, id],
    });
  };

  const pickCondition = (id: ConditionId) => {
    H.tapLight();
    updateProfile({ condition: id });
  };

  const pickGoal = (g: number) => {
    H.tapLight();
    updateProfile({ stepGoal: g });
  };

  const confirmReset = () => {
    H.tapMedium();
    Alert.alert(
      "Reset progress?",
      "This clears your journey data but keeps your profile.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: reset },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.h1}>
        {profile.name.trim() ? `${profile.name.trim()}'s profile` : "Your progress"}
      </Text>

      {/* Personalization */}
      <Text style={styles.h2}>Personalization</Text>
      <Card style={{ gap: theme.space(3) }}>
        <View>
          <Text style={styles.fieldLabel}>Condition</Text>
          <View style={styles.chipRow}>
            {CONDITIONS.map((c) => {
              const sel = profile.condition === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => pickCondition(c.id as ConditionId)}
                  style={[styles.chip, sel && styles.chipSel]}
                >
                  <Text style={[styles.chipText, sel && { color: "#fff" }]}>
                    {c.emoji} {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Medications</Text>
          <View style={styles.chipRow}>
            {MEDICATIONS.map((m) => {
              const sel = profile.medications.includes(m.id);
              return (
                <Pressable
                  key={m.id}
                  onPress={() => toggleMed(m.id)}
                  style={[styles.chip, sel && styles.chipSel]}
                >
                  <Text style={[styles.chipText, sel && { color: "#fff" }]}>
                    {m.emoji} {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Daily step goal</Text>
          <View style={styles.chipRow}>
            {STEP_GOAL_OPTIONS.map((g) => {
              const sel = profile.stepGoal === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => pickGoal(g)}
                  style={[styles.chip, sel && styles.chipSel]}
                >
                  <Text style={[styles.chipText, sel && { color: "#fff" }]}>
                    {g.toLocaleString()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      {/* Reminders */}
      <Text style={styles.h2}>Reminders</Text>
      <RemindersCard />

      <Text style={styles.h2}>Your progress</Text>

      <Card style={{ gap: theme.space(2) }}>
        <Text style={styles.level}>Level {level.level}</Text>
        <ProgressBar value={level.progress} color={theme.colors.xp} />
        <View style={styles.summaryRow}>
          <Summary value={`${progress.xp}`} label="total XP" />
          <Summary value={`${progress.streak}`} label="streak" />
          <Summary value={`${completedLessons.length}`} label="lessons" />
          <Summary value={`${owned.size}`} label="badges" />
        </View>
      </Card>

      <Text style={styles.h2}>Achievements</Text>
      <AchievementsCard />

      <Text style={styles.h2}>Badges</Text>
      <View style={styles.badgeGrid}>
        {BADGES.map((b) => {
          const has = owned.has(b.id);
          return (
            <Card key={b.id} style={[styles.badge, !has && styles.locked]}>
              <Text style={[styles.badgeEmoji, !has && { opacity: 0.3 }]}>
                {has ? b.emoji : "🔒"}
              </Text>
              <Text style={styles.badgeLabel}>{b.label}</Text>
              <Text style={styles.badgeDesc}>{b.description}</Text>
            </Card>
          );
        })}
      </View>

      <FadeIn style={{ marginTop: theme.space(4), gap: theme.space(2.5) }}>
        <Button
          label="Replay walkthrough"
          variant="ghost"
          onPress={() => {
            H.tapLight();
            updateProfile({ tutorialSeen: false });
          }}
        />
        <Button label="Reset progress" variant="ghost" onPress={confirmReset} />
      </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

function Summary({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4), gap: theme.space(3), paddingBottom: 40 },
  h1: { fontSize: 26, fontWeight: "800", color: theme.colors.text },
  h2: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: theme.space(2),
  },
  level: { fontSize: 22, fontWeight: "800", color: theme.colors.text },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.subtext,
    marginBottom: theme.space(2),
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.space(2) },
  chip: {
    paddingVertical: theme.space(2),
    paddingHorizontal: theme.space(3),
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
  },
  chipSel: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: theme.colors.text },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.space(2),
  },
  summary: { alignItems: "center", flex: 1 },
  summaryValue: { fontSize: 20, fontWeight: "800", color: theme.colors.text },
  summaryLabel: { fontSize: 11, color: theme.colors.subtext, marginTop: 2 },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.space(2.5) },
  badge: { width: "47%", alignItems: "center", gap: theme.space(1) },
  locked: { opacity: 0.7 },
  badgeEmoji: { fontSize: 34 },
  badgeLabel: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
  badgeDesc: {
    fontSize: 11,
    color: theme.colors.subtext,
    textAlign: "center",
    lineHeight: 15,
  },
});
