/**
 * DeviceScreen.tsx — connect devices & record readings (PRD Vol 2 / Vol 5).
 * Pairing flow + connected-device management, a Health Connect explainer, and manual
 * glucose entry with validation. On Android, production builds read real data via
 * Health Connect / BLE; manual entry keeps the app useful before a device is linked.
 */
import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useGame } from "../state/GameContext";
import { DEVICE_CATALOG, DeviceKind, validateGlucoseReading } from "../lib/health";
import { classifyGlucoseLevel, GLUCOSE_LEVEL, GlucoseLevel } from "../lib/ada";
import { formatMarker } from "../lib/units";
import { MARKERS } from "../engine/physiology";
import { Card, Button, Pill } from "../components/ui";
import { theme } from "../theme";

// ADA hypoglycemia levels → colour (Level 2 <54 and >250 are urgent).
const LEVEL_COLOR: Record<GlucoseLevel, string> = {
  level2: theme.colors.bad,
  level1: theme.colors.warn,
  inRange: theme.colors.good,
  high: theme.colors.warn,
  veryHigh: theme.colors.bad,
};

export function DeviceScreen() {
  const navigation = useNavigation<any>();
  const { pairedDevices, pairDevice, unpairDevice, readings, addReading, profile } = useGame();
  const [pairing, setPairing] = useState<DeviceKind | null>(null);
  const [entry, setEntry] = useState("");

  const startPairing = (kind: DeviceKind, label: string) => {
    setPairing(kind);
    setTimeout(() => {
      pairDevice(kind, label);
      setPairing(null);
    }, 800);
  };

  const submitReading = () => {
    const v = validateGlucoseReading(parseFloat(entry), profile.glucoseUnit);
    if (!v.ok) {
      Alert.alert("Check the reading", v.error ?? "Invalid value.");
      return;
    }
    addReading(v.mgdl, "manual");
    setEntry("");
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.h1}>Devices & readings</Text>
      </View>

      {pairedDevices.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.section}>Connected</Text>
          {pairedDevices.map((d) => (
            <View key={d.id} style={styles.deviceRow}>
              <Text style={styles.deviceName}>{d.name}</Text>
              <Pressable onPress={() => unpairDevice(d.id)} accessibilityRole="button">
                <Text style={styles.unpair}>Unpair</Text>
              </Pressable>
            </View>
          ))}
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={styles.section}>Add a device</Text>
        {DEVICE_CATALOG.map((d) => (
          <Pressable key={d.kind} onPress={() => startPairing(d.kind, d.label)} style={styles.catalogRow}>
            <Text style={styles.catalogEmoji}>{d.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.catalogLabel}>{d.label}</Text>
              <Text style={styles.catalogBlurb}>{d.blurb}</Text>
            </View>
            <Text style={styles.connect}>{pairing === d.kind ? "Pairing…" : "Connect"}</Text>
          </Pressable>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.section}>Health Connect (Android)</Text>
        <Text style={styles.hint}>
          Production builds sync steps and glucose automatically via Android Health Connect.
          Until your device is linked, you can add readings manually below.
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.section}>Add a glucose reading</Text>
        <View style={styles.entryRow}>
          <TextInput
            style={styles.input}
            value={entry}
            onChangeText={setEntry}
            keyboardType="decimal-pad"
            placeholder={`Value in ${profile.glucoseUnit}`}
            placeholderTextColor={theme.colors.subtext}
            accessibilityLabel="Glucose reading value"
          />
          <Button label="Add" onPress={submitReading} />
        </View>
      </Card>

      {readings.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.section}>Recent readings</Text>
          {readings.slice(0, 10).map((r) => {
            const level = classifyGlucoseLevel(r.mgdl);
            const fmt = formatMarker(MARKERS.glucose, r.mgdl, profile.glucoseUnit);
            return (
              <View key={r.id} style={styles.readingRow}>
                <Text style={styles.readingValue}>
                  {fmt.value} <Text style={styles.readingUnit}>{fmt.unit}</Text>
                </Text>
                <Pill label={GLUCOSE_LEVEL[level].label} color={LEVEL_COLOR[level]} />
              </View>
            );
          })}
        </Card>
      )}

      <Text style={styles.disclaimer}>
        Manual readings are recorded for your awareness — not interpreted as medical advice.
      </Text>
    </ScrollView>
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
  hint: { fontSize: 12, color: theme.colors.subtext, lineHeight: 18 },
  deviceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  deviceName: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
  unpair: { color: theme.colors.bad, fontWeight: "700", fontSize: 13 },
  catalogRow: { flexDirection: "row", alignItems: "center", gap: theme.space(3), paddingVertical: theme.space(1) },
  catalogEmoji: { fontSize: 26 },
  catalogLabel: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
  catalogBlurb: { fontSize: 11, color: theme.colors.subtext, marginTop: 1 },
  connect: { color: theme.colors.primary, fontWeight: "700", fontSize: 13 },
  entryRow: { flexDirection: "row", gap: theme.space(2), alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space(3.5),
    paddingVertical: theme.space(3),
    color: theme.colors.text,
    fontSize: 15,
  },
  readingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: theme.space(1) },
  readingValue: { fontSize: 16, fontWeight: "800", color: theme.colors.text },
  readingUnit: { fontSize: 11, fontWeight: "600", color: theme.colors.subtext },
  disclaimer: { fontSize: 11, color: theme.colors.subtext, textAlign: "center", marginTop: theme.space(2), lineHeight: 16 },
});
