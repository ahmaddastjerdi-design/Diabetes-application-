/**
 * MedicationsScreen.tsx — educational medication guide (T2DM + comorbidities).
 * Browse drug classes, read dose-free educational notes, and mark "I take this" to keep a
 * personal list. NOT a prescription and shows NO doses — your clinician decides treatment.
 */
import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useGame } from "../state/GameContext";
import { MEDICATION_CATALOG, MED_DISCLAIMER, DrugCategory } from "../data/medications";
import { Card } from "../components/ui";
import { theme } from "../theme";

export function MedicationsScreen() {
  const navigation = useNavigation<any>();
  const { myMedications, toggleMedication } = useGame();
  const [open, setOpen] = useState<string | null>("biguanide");

  const diabetes = MEDICATION_CATALOG.filter((c) => c.group === "diabetes");
  const comorbid = MEDICATION_CATALOG.filter((c) => c.group === "comorbidity");

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.h1}>Medication guide</Text>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>{MED_DISCLAIMER}</Text>
      </View>

      {myMedications.length > 0 && (
        <Text style={styles.summary}>You marked {myMedications.length} medicine(s) as yours.</Text>
      )}

      <Text style={styles.groupTitle}>Diabetes (glucose-lowering)</Text>
      {diabetes.map((c) => (
        <Category key={c.id} cat={c} open={open === c.id} onToggle={() => setOpen(open === c.id ? null : c.id)} mine={myMedications} onPick={toggleMedication} />
      ))}

      <Text style={styles.groupTitle}>Other conditions (comorbidities)</Text>
      {comorbid.map((c) => (
        <Category key={c.id} cat={c} open={open === c.id} onToggle={() => setOpen(open === c.id ? null : c.id)} mine={myMedications} onPick={toggleMedication} />
      ))}
    </ScrollView>
  );
}

function Category({
  cat,
  open,
  onToggle,
  mine,
  onPick,
}: {
  cat: DrugCategory;
  open: boolean;
  onToggle: () => void;
  mine: string[];
  onPick: (id: string) => void;
}) {
  return (
    <Card style={styles.card}>
      <Pressable onPress={onToggle} style={styles.catHead} accessibilityRole="button">
        <View style={{ flex: 1 }}>
          <Text style={styles.catTitle}>{cat.title}</Text>
          <Text style={styles.catSub}>{cat.subtitle}</Text>
        </View>
        <Text style={styles.chevron}>{open ? "▾" : "▸"}</Text>
      </Pressable>
      {open &&
        cat.drugs.map((d) => {
          const picked = mine.includes(d.id);
          return (
            <Pressable key={d.id} onPress={() => onPick(d.id)} style={styles.drugRow}>
              <View style={[styles.checkbox, picked && styles.checkboxOn]}>{picked && <Text style={styles.check}>✓</Text>}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.drugName}>{d.generic}</Text>
                {d.persian ? <Text style={styles.drugPersian}>{d.persian}</Text> : null}
                <Text style={styles.drugNote}>{d.note}</Text>
                {d.form || d.strengths ? (
                  <Text style={styles.drugMeta}>{[d.form, d.strengths].filter(Boolean).join(" · ")}</Text>
                ) : null}
                {d.usualDose ? <Text style={styles.drugDose}>Reference dose: {d.usualDose}</Text> : null}
              </View>
            </Pressable>
          );
        })}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4), gap: theme.space(3), paddingBottom: 40 },
  header: { gap: theme.space(1) },
  back: { color: theme.colors.primary, fontSize: 16, fontWeight: "600" },
  h1: { fontSize: 26, fontWeight: "800", color: theme.colors.text },
  banner: { backgroundColor: theme.colors.warn + "22", borderRadius: theme.radius.md, padding: theme.space(3) },
  bannerText: { fontSize: 12, color: theme.colors.warn, lineHeight: 17, fontWeight: "600" },
  summary: { fontSize: 13, color: theme.colors.subtext },
  groupTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.text, marginTop: theme.space(2) },
  card: { gap: theme.space(2) },
  catHead: { flexDirection: "row", alignItems: "center" },
  catTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  catSub: { fontSize: 12, color: theme.colors.subtext, marginTop: 1 },
  chevron: { fontSize: 18, color: theme.colors.primary, paddingLeft: theme.space(2) },
  drugRow: { flexDirection: "row", gap: theme.space(3), alignItems: "flex-start", paddingTop: theme.space(2), borderTopWidth: 1, borderTopColor: theme.colors.border },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkboxOn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  check: { color: "#fff", fontWeight: "800", fontSize: 13 },
  drugName: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
  drugPersian: { fontSize: 13, color: theme.colors.text, marginTop: 1, textAlign: "right", writingDirection: "rtl" },
  drugNote: { fontSize: 12, color: theme.colors.subtext, marginTop: 2, lineHeight: 17 },
  drugMeta: { fontSize: 11, color: theme.colors.text, marginTop: 3, fontWeight: "600" },
  drugDose: { fontSize: 11, color: theme.colors.primary, marginTop: 1, lineHeight: 15 },
});
