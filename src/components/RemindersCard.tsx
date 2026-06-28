/**
 * RemindersCard.tsx — daily medication reminder settings (Profile screen).
 * Toggling on requests permission and schedules a daily local notification;
 * changing the time reschedules. Degrades gracefully if permission is denied.
 */
import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Switch } from "react-native";
import { useGame } from "../state/GameContext";
import { REMINDER_TIMES, reminderBody } from "../data/profile";
import {
  requestPermission,
  scheduleMedicationReminder,
  cancelMedicationReminder,
} from "../services/notifications";
import { Card } from "./ui";
import * as H from "../services/haptics";
import { theme } from "../theme";

export function RemindersCard() {
  const { profile, updateProfile } = useGame();
  const [note, setNote] = useState<string | null>(null);

  const apply = async (enabled: boolean, hour: number) => {
    if (!enabled) {
      await cancelMedicationReminder();
      updateProfile({ reminderEnabled: false });
      setNote(null);
      return;
    }
    const granted = await requestPermission();
    if (!granted) {
      updateProfile({ reminderEnabled: false });
      setNote("Notifications are off. Enable them in system settings to get reminders.");
      return;
    }
    const ok = await scheduleMedicationReminder(
      hour,
      0,
      reminderBody(profile.medications)
    );
    updateProfile({ reminderEnabled: ok, reminderHour: hour });
    setNote(
      ok
        ? null
        : "Couldn't schedule here — reminders need a development build on Android."
    );
  };

  const onToggle = (v: boolean) => {
    H.tapMedium();
    apply(v, profile.reminderHour);
  };

  const onPickTime = (hour: number) => {
    H.tapLight();
    apply(true, hour);
  };

  return (
    <Card style={{ gap: theme.space(3) }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>💊 Medication reminder</Text>
          <Text style={styles.sub}>A gentle daily nudge to stay on track.</Text>
        </View>
        <Switch
          value={profile.reminderEnabled}
          onValueChange={onToggle}
          trackColor={{ true: theme.colors.primary }}
        />
      </View>

      {profile.reminderEnabled && (
        <View style={styles.times}>
          {REMINDER_TIMES.map((t) => {
            const sel = profile.reminderHour === t.hour;
            return (
              <Pressable
                key={t.hour}
                onPress={() => onPickTime(t.hour)}
                style={[styles.chip, sel && styles.chipSel]}
              >
                <Text style={[styles.chipText, sel && { color: "#fff" }]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {note && <Text style={styles.note}>{note}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: theme.space(3) },
  title: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  sub: { fontSize: 12, color: theme.colors.subtext, marginTop: 2 },
  times: { flexDirection: "row", flexWrap: "wrap", gap: theme.space(2) },
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
  note: { fontSize: 12, color: theme.colors.subtext, lineHeight: 17 },
});
