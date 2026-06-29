/**
 * VitalsScreen.tsx — record blood glucose & blood pressure and chart them over time
 * (hourly / daily / weekly / monthly). Sync (Settings → Cloud sync) sends them to the
 * care team. Educational; clinical interpretation is your clinician's.
 */
import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { useGame } from "../state/GameContext";
import { validateGlucoseReading } from "../lib/health";
import { classifyGlucoseLevel } from "../lib/ada";
import { formatMarker } from "../lib/units";
import { MARKERS } from "../engine/physiology";
import { bucketSeries, seriesRange, Granularity, SeriesPoint } from "../lib/trends";
import { METRICS, getMetric, bmi, bmiCategory, METRICS_DISCLAIMER } from "../data/metrics";
import { BarChart } from "../components/BarChart";
import { Card } from "../components/ui";
import { theme } from "../theme";

const targetColor = (target: [number, number] | undefined) => (v: number) => {
  if (!target) return theme.colors.primary;
  return v < target[0] || v > target[1] ? theme.colors.warn : theme.colors.good;
};

const RANGES: { key: Granularity; label: string }[] = [
  { key: "hourly", label: "Hourly" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const glucoseColor = (mgdl: number) => {
  const l = classifyGlucoseLevel(mgdl);
  if (l === "level2" || l === "veryHigh") return theme.colors.bad;
  if (l === "level1" || l === "high") return theme.colors.warn;
  return theme.colors.good;
};
const sysColor = (v: number) => (v >= 140 ? theme.colors.bad : v >= 130 ? theme.colors.warn : theme.colors.good);
const diaColor = (v: number) => (v >= 90 ? theme.colors.bad : v >= 80 ? theme.colors.warn : theme.colors.good);

export function VitalsScreen() {
  const { readings, addReading, addBpReading, measurements, addMeasurement, profile } = useGame();
  const [gran, setGran] = useState<Granularity>("hourly");
  const [glucose, setGlucose] = useState("");
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [metricKey, setMetricKey] = useState<string>("ldl");
  const [metricVal, setMetricVal] = useState("");
  const now = Date.now();

  const glucosePoints: SeriesPoint[] = readings
    .filter((r) => r.mgdl != null)
    .map((r) => ({ atMs: r.atMs, value: r.mgdl as number }));
  const sysPoints: SeriesPoint[] = readings
    .filter((r) => r.kind === "bp" && r.systolic != null)
    .map((r) => ({ atMs: r.atMs, value: r.systolic as number }));
  const diaPoints: SeriesPoint[] = readings
    .filter((r) => r.kind === "bp" && r.diastolic != null)
    .map((r) => ({ atMs: r.atMs, value: r.diastolic as number }));

  const gBuckets = bucketSeries(glucosePoints, gran, now);
  const sBuckets = bucketSeries(sysPoints, gran, now);
  const dBuckets = bucketSeries(diaPoints, gran, now);

  const addGlucose = () => {
    const v = validateGlucoseReading(parseFloat(glucose), profile.glucoseUnit);
    if (!v.ok) return Alert.alert("Check the reading", v.error ?? "Invalid value.");
    addReading(v.mgdl, "manual");
    setGlucose("");
  };

  const addBp = () => {
    const s = parseInt(sys, 10);
    const d = parseInt(dia, 10);
    if (!Number.isFinite(s) || !Number.isFinite(d)) return Alert.alert("Check the reading", "Enter both numbers.");
    if (s < 70 || s > 260 || d < 40 || d > 160 || d >= s) return Alert.alert("Check the reading", "Those values look out of range.");
    addBpReading(s, d, "manual");
    setSys("");
    setDia("");
  };

  const selectedMetric = getMetric(metricKey);
  const metricPoints: SeriesPoint[] = measurements
    .filter((m) => m.metricKey === metricKey)
    .map((m) => ({ atMs: m.atMs, value: m.value }));
  const mBuckets = bucketSeries(metricPoints, gran, now);
  const latestOf = (key: string) => measurements.filter((m) => m.metricKey === key).sort((a, b) => b.atMs - a.atMs)[0]?.value;
  const wt = latestOf("weight");
  const ht = latestOf("height");
  const bmiValue = wt != null && ht != null ? bmi(wt, ht) : null;

  const addMetric = () => {
    const v = parseFloat(metricVal);
    if (!Number.isFinite(v) || v <= 0) return Alert.alert("Check the value", "Enter a number.");
    addMeasurement(metricKey, v, "manual");
    setMetricVal("");
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Vitals & trends</Text>

      {/* Entry */}
      <Card style={styles.card}>
        <Text style={styles.section}>Add blood glucose ({profile.glucoseUnit})</Text>
        <View style={styles.row}>
          <TextInput style={styles.input} value={glucose} onChangeText={setGlucose} keyboardType="decimal-pad" placeholder={`e.g. ${profile.glucoseUnit === "mmol/L" ? "7.0" : "120"}`} placeholderTextColor={theme.colors.subtext} />
          <Pressable style={styles.addBtn} onPress={addGlucose}><Text style={styles.addText}>Add</Text></Pressable>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.section}>Add blood pressure (mmHg)</Text>
        <View style={styles.row}>
          <TextInput style={styles.inputSmall} value={sys} onChangeText={setSys} keyboardType="number-pad" placeholder="Systolic" placeholderTextColor={theme.colors.subtext} />
          <Text style={styles.slash}>/</Text>
          <TextInput style={styles.inputSmall} value={dia} onChangeText={setDia} keyboardType="number-pad" placeholder="Diastolic" placeholderTextColor={theme.colors.subtext} />
          <Pressable style={styles.addBtn} onPress={addBp}><Text style={styles.addText}>Add</Text></Pressable>
        </View>
      </Card>

      {/* Range selector */}
      <View style={styles.segment}>
        {RANGES.map((r) => (
          <Pressable key={r.key} onPress={() => setGran(r.key)} style={[styles.segItem, gran === r.key && styles.segItemOn]}>
            <Text style={[styles.segText, gran === r.key && styles.segTextOn]}>{r.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Charts */}
      <Card style={styles.card}>
        <Text style={styles.section}>Blood glucose (mg/dL)</Text>
        <BarChart buckets={gBuckets} range={seriesRange(gBuckets, [60, 200])} colorFor={glucoseColor} />
        <Text style={styles.legend}>Green = in range (70–180), amber/red = out of range (ADA).</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.section}>Blood pressure — systolic (mmHg)</Text>
        <BarChart buckets={sBuckets} range={seriesRange(sBuckets, [90, 150])} colorFor={sysColor} />
        <Text style={styles.section}>Diastolic (mmHg)</Text>
        <BarChart buckets={dBuckets} range={seriesRange(dBuckets, [60, 100])} colorFor={diaColor} />
        <Text style={styles.legend}>Target under 130/80 mmHg (ADA); your clinician sets your goal.</Text>
      </Card>

      {/* Labs & body metrics */}
      <Card style={styles.card}>
        <Text style={styles.section}>Labs & body</Text>
        <View style={styles.metricChips}>
          {METRICS.map((m) => (
            <Pressable key={m.key} onPress={() => setMetricKey(m.key)} style={[styles.metricChip, metricKey === m.key && styles.metricChipOn]}>
              <Text style={[styles.metricChipText, metricKey === m.key && styles.metricChipTextOn]}>{m.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.row}>
          <TextInput style={styles.input} value={metricVal} onChangeText={setMetricVal} keyboardType="decimal-pad" placeholder={selectedMetric ? `Value (${selectedMetric.unit})` : "Value"} placeholderTextColor={theme.colors.subtext} />
          <Pressable style={styles.addBtn} onPress={addMetric}><Text style={styles.addText}>Add</Text></Pressable>
        </View>
        {selectedMetric && (
          <>
            <Text style={styles.section}>{selectedMetric.label} ({selectedMetric.unit})</Text>
            <BarChart buckets={mBuckets} range={seriesRange(mBuckets, selectedMetric.target ?? [0, 1])} colorFor={targetColor(selectedMetric.target)} />
            {selectedMetric.target && <Text style={styles.legend}>Reference range {selectedMetric.target[0]}–{selectedMetric.target[1]} {selectedMetric.unit}.</Text>}
          </>
        )}
        {bmiValue != null && (
          <Text style={styles.bmi}>BMI: {bmiValue} — {bmiCategory(bmiValue)} (from latest weight {wt} kg & height {ht} cm)</Text>
        )}
        <Text style={styles.legend}>{METRICS_DISCLAIMER}</Text>
      </Card>

      <Text style={styles.sync}>
        {profile.syncEnabled
          ? "Cloud sync is ON — use Settings → Sync now to send these to your care team."
          : "Turn on Cloud sync in Settings to send these readings to your doctor."}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4), gap: theme.space(3), paddingBottom: 48 },
  h1: { fontSize: 26, fontWeight: "800", color: theme.colors.text },
  card: { gap: theme.space(2) },
  section: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
  row: { flexDirection: "row", gap: theme.space(2), alignItems: "center" },
  input: { flex: 1, backgroundColor: theme.colors.bg, borderRadius: theme.radius.md, paddingHorizontal: theme.space(3.5), paddingVertical: theme.space(3), color: theme.colors.text, fontSize: 15 },
  inputSmall: { flex: 1, backgroundColor: theme.colors.bg, borderRadius: theme.radius.md, paddingHorizontal: theme.space(3), paddingVertical: theme.space(3), color: theme.colors.text, fontSize: 15 },
  slash: { fontSize: 18, fontWeight: "800", color: theme.colors.subtext },
  addBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, paddingHorizontal: theme.space(4), justifyContent: "center" },
  addText: { color: "#fff", fontWeight: "700" },
  segment: { flexDirection: "row", backgroundColor: theme.colors.card, borderRadius: theme.radius.md, padding: 4, gap: 4, borderWidth: 1, borderColor: theme.colors.border },
  segItem: { flex: 1, paddingVertical: theme.space(2), borderRadius: theme.radius.sm, alignItems: "center" },
  segItemOn: { backgroundColor: theme.colors.primary },
  segText: { fontWeight: "700", color: theme.colors.subtext, fontSize: 13 },
  segTextOn: { color: "#fff" },
  legend: { fontSize: 11, color: theme.colors.subtext, marginTop: 2, lineHeight: 16 },
  metricChips: { flexDirection: "row", flexWrap: "wrap", gap: theme.space(1.5) },
  metricChip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingVertical: theme.space(1), paddingHorizontal: theme.space(2.5) },
  metricChipOn: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + "11" },
  metricChipText: { fontSize: 11, fontWeight: "600", color: theme.colors.text },
  metricChipTextOn: { color: theme.colors.primary },
  bmi: { fontSize: 13, fontWeight: "700", color: theme.colors.text, marginTop: theme.space(1) },
  sync: { fontSize: 12, color: theme.colors.subtext, textAlign: "center", marginTop: theme.space(1), lineHeight: 17 },
});

