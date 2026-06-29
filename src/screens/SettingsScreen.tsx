/**
 * SettingsScreen.tsx — profile & preferences (PRD Vol 2: settings).
 * Glucose units, condition, reminders, plus privacy actions (export / delete) reflecting
 * the educational-only, local-data posture.
 */
import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet, Switch, Pressable, Alert, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useGame, ConditionType } from "../state/GameContext";
import { GlucoseUnit } from "../lib/units";
import { REMINDER_SLOTS } from "../lib/health";
import { ADA_TARGETS, ADA_SCREENINGS, ADA_SOURCE } from "../lib/ada";
import { syncAll, pendingCount } from "../lib/sync";
import { Card, Button } from "../components/ui";
import { theme } from "../theme";

const CONDITION_LABEL: Record<ConditionType, string> = {
  type1: "Type 1",
  type2: "Type 2",
  prediabetes: "Prediabetes",
  gestational: "Gestational",
  other: "Other / not sure",
};

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { profile, updateProfile, body, progress, completedLessons, reset, reminders, toggleReminder, pairedDevices, outbox, markSynced, readings } =
    useGame();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const doSync = async () => {
    setSyncing(true);
    setSyncMsg("");
    const res = await syncAll({ baseUrl: profile.backendUrl, userId: profile.patientId }, outbox, readings);
    if (res.ok) {
      markSynced(res.syncedIds);
      const sp = res.serverProgress;
      setSyncMsg(
        `Synced ${res.pushed} event(s) + ${res.readingsPushed} reading(s). Server: ${sp?.xp ?? "?"} XP, ${sp?.streak ?? "?"}-day streak.`
      );
    } else {
      setSyncMsg(`Sync failed: ${res.error ?? "unknown error"}`);
    }
    setSyncing(false);
  };

  const exportData = () =>
    Alert.alert(
      "Your data (on this device)",
      JSON.stringify({ profile, body, progress, completedLessons }, null, 2).slice(0, 700),
      [{ text: "OK" }]
    );

  const deleteData = () =>
    Alert.alert("Delete journey data?", "This clears your simulation, XP and lessons. Your profile stays.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: reset },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.h1}>Settings</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.section}>Glucose units</Text>
        <Segmented<GlucoseUnit>
          options={[{ key: "mg/dL", label: "mg/dL" }, { key: "mmol/L", label: "mmol/L" }]}
          value={profile.glucoseUnit}
          onChange={(u) => updateProfile({ glucoseUnit: u })}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.section}>Your targets (ADA-based)</Text>
        {ADA_TARGETS.map((t) => (
          <View key={t.key} style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: theme.space(2) }}>
              <Text style={styles.targetLabel}>{t.label}</Text>
              {t.note ? <Text style={styles.hint}>{t.note}</Text> : null}
            </View>
            <Text style={styles.targetValue}>{t.target}</Text>
          </View>
        ))}
        <Text style={[styles.section, { marginTop: theme.space(1) }]}>Recommended check-ups</Text>
        {ADA_SCREENINGS.map((s) => (
          <Text key={s} style={styles.hint}>{`• ${s}`}</Text>
        ))}
        <Text style={[styles.hint, { marginTop: theme.space(1), fontStyle: "italic" }]}>{ADA_SOURCE}</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.section}>Condition</Text>
        <View style={styles.chips}>
          {(Object.keys(CONDITION_LABEL) as ConditionType[]).map((c) => (
            <Pressable
              key={c}
              onPress={() => updateProfile({ conditionType: c })}
              style={[styles.chip, profile.conditionType === c && styles.chipOn]}
            >
              <Text style={[styles.chipText, profile.conditionType === c && styles.chipTextOn]}>
                {CONDITION_LABEL[c]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={[styles.card, styles.rowBetween]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.section}>Daily reminders</Text>
          <Text style={styles.hint}>A gentle nudge to log a choice.</Text>
        </View>
        <Switch
          value={profile.remindersEnabled}
          onValueChange={(v) => updateProfile({ remindersEnabled: v })}
          trackColor={{ true: theme.colors.primary }}
        />
      </Card>

      {profile.remindersEnabled && (
        <Card style={styles.card}>
          <Text style={styles.section}>Reminder times</Text>
          <View style={styles.chips}>
            {REMINDER_SLOTS.map((s) => {
              const on = reminders.includes(s.id);
              return (
                <Pressable key={s.id} onPress={() => toggleReminder(s.id)} style={[styles.chip, on && styles.chipOn]}>
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{`${s.label} · ${s.time}`}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>Scheduled on this device. Delivery uses system notifications in production builds.</Text>
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={styles.section}>Devices</Text>
        <Text style={styles.hint}>{`${pairedDevices.length} connected`}</Text>
        <Button label="Manage devices & readings" variant="ghost" onPress={() => navigation.navigate("Devices")} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.section}>Cloud sync (beta)</Text>
        <Text style={styles.hint}>
          Off by default — your data stays on this device until you enable it. When on, your logged
          choices sync to the care platform, which computes your official progress.
        </Text>
        <View style={styles.rowBetween}>
          <Text style={styles.section}>Enable sync</Text>
          <Switch
            value={profile.syncEnabled}
            onValueChange={(v) => updateProfile({ syncEnabled: v })}
            trackColor={{ true: theme.colors.primary }}
          />
        </View>
        {profile.syncEnabled && (
          <>
            <TextInput
              style={styles.urlInput}
              value={profile.backendUrl}
              onChangeText={(t) => updateProfile({ backendUrl: t })}
              placeholder="https://backend.example.com"
              placeholderTextColor={theme.colors.subtext}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Backend URL"
            />
            <Button
              label={syncing ? "Syncing…" : `Sync now (${pendingCount(outbox)} pending)`}
              onPress={doSync}
              disabled={syncing || !profile.backendUrl}
            />
            {syncMsg ? <Text style={styles.hint}>{syncMsg}</Text> : null}
          </>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.section}>Privacy</Text>
        <Text style={styles.hint}>Your data stays on this device. No account, no PII leaves your phone.</Text>
        <Button label="Export my data" variant="ghost" onPress={exportData} />
        <Button label="Delete journey data" variant="ghost" onPress={deleteData} />
      </Card>

      <Text style={styles.disclaimer}>
        Educational simulation — not medical advice, not a diagnosis, not a medical device.
      </Text>
    </ScrollView>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => (
        <Pressable
          key={o.key}
          onPress={() => onChange(o.key)}
          style={[styles.segmentItem, value === o.key && styles.segmentItemOn]}
        >
          <Text style={[styles.segmentText, value === o.key && styles.segmentTextOn]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4), gap: theme.space(3), paddingBottom: 40 },
  header: { gap: theme.space(1) },
  back: { color: theme.colors.primary, fontSize: 16, fontWeight: "600" },
  h1: { fontSize: 26, fontWeight: "800", color: theme.colors.text },
  card: { gap: theme.space(2.5) },
  section: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  hint: { fontSize: 12, color: theme.colors.subtext, lineHeight: 17 },
  rowBetween: { flexDirection: "row", alignItems: "center" },
  segment: { flexDirection: "row", backgroundColor: theme.colors.bg, borderRadius: theme.radius.md, padding: 4, gap: 4 },
  segmentItem: { flex: 1, paddingVertical: theme.space(2.5), borderRadius: theme.radius.sm, alignItems: "center" },
  segmentItemOn: { backgroundColor: theme.colors.primary },
  segmentText: { fontWeight: "700", color: theme.colors.subtext },
  segmentTextOn: { color: "#fff" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.space(2) },
  chip: {
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.radius.pill,
    paddingVertical: theme.space(1.5), paddingHorizontal: theme.space(3),
  },
  chipOn: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + "11" },
  chipText: { fontSize: 13, fontWeight: "600", color: theme.colors.text },
  chipTextOn: { color: theme.colors.primary },
  targetLabel: { fontSize: 13, fontWeight: "600", color: theme.colors.text },
  targetValue: { fontSize: 13, fontWeight: "800", color: theme.colors.primary },
  urlInput: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space(3.5),
    paddingVertical: theme.space(3),
    color: theme.colors.text,
    fontSize: 14,
  },
  disclaimer: { fontSize: 11, color: theme.colors.subtext, textAlign: "center", marginTop: theme.space(2), lineHeight: 16 },
});
