/** HomeScreen.tsx — the dashboard: level, streak, organs, and live markers. */
import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useGame } from "../state/GameContext";
import { MARKERS, MarkerKey, ORGANS, OrganKey } from "../engine/physiology";
import { xpForLevel } from "../engine/gamification";
import { OrganCard } from "../components/OrganCard";
import { MarkerRow } from "../components/MarkerRow";
import { ActivityCard } from "../components/ActivityCard";
import { BodyDiagram } from "../components/BodyDiagram";
import { OrganDetailSheet } from "../components/OrganDetailSheet";
import { GoalsCard } from "../components/GoalsCard";
import { A1cCard } from "../components/A1cCard";
import { WeeklySummaryCard } from "../components/WeeklySummaryCard";
import { Card } from "../components/ui";
import { CountUp, AnimatedBar, FadeIn } from "../components/anim";
import { getCondition } from "../data/profile";
import * as H from "../services/haptics";
import { theme } from "../theme";

export function HomeScreen() {
  const { body, progress, level, inRangeCount, profile } = useGame();
  const condition = getCondition(profile.condition);
  const name = profile.name.trim();
  const markerKeys = Object.keys(MARKERS) as MarkerKey[];
  const [selectedOrgan, setSelectedOrgan] = useState<OrganKey | null>(null);

  const openOrgan = (k: OrganKey) => {
    H.tapLight();
    setSelectedOrgan(k);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient hero with greeting + stats */}
        <FadeIn>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.greeting}>
              {name ? `Hi ${name} 👋` : "Your body today"}
            </Text>
            <Text style={styles.heroSub}>
              {condition.emoji} {condition.label} · Day {body.day}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statBig}>Lv {level.level}</Text>
                <Text style={styles.statLabel}>{progress.xp} XP</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statBig}>🔥 {progress.streak}</Text>
                <Text style={styles.statLabel}>day streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <CountUp
                  value={inRangeCount}
                  suffix={`/${markerKeys.length}`}
                  style={styles.statBig}
                />
                <Text style={styles.statLabel}>in range</Text>
              </View>
            </View>

            <View style={{ marginTop: theme.space(3) }}>
              <AnimatedBar
                value={level.progress}
                color="#fff"
                trackColor="rgba(255,255,255,0.25)"
              />
              <Text style={styles.xpHint}>
                {Math.max(0, xpForLevel(level.level) - progress.xp)} XP to level{" "}
                {level.level + 1}
              </Text>
            </View>
          </LinearGradient>
        </FadeIn>

        {/* Today's goals — the daily hook */}
        <FadeIn delay={50}>
          <GoalsCard />
        </FadeIn>

        {/* Living body — the centerpiece */}
        <FadeIn delay={70}>
          <BodyDiagram organs={body.organs} onSelectOrgan={openOrgan} />
        </FadeIn>

        {/* Long-term control */}
        <FadeIn delay={90}>
          <A1cCard body={body} />
        </FadeIn>

        {/* Weekly recap */}
        <FadeIn delay={100}>
          <WeeklySummaryCard body={body} />
        </FadeIn>

        {/* Real-data activity */}
        <FadeIn delay={110}>
          <ActivityCard />
        </FadeIn>

        {/* Organs */}
        <Text style={styles.h2}>Organ detail</Text>
        {(Object.keys(ORGANS) as OrganKey[]).map((k, i) => (
          <FadeIn key={k} delay={120 + i * 80}>
            <OrganCard
              organ={ORGANS[k]}
              score={body.organs[k]}
              onPress={() => openOrgan(k)}
            />
          </FadeIn>
        ))}

        {/* Markers */}
        <Text style={styles.h2}>Live markers</Text>
        <FadeIn delay={120}>
          <Card>
            {markerKeys.map((k, i) => (
              <View key={k}>
                {i > 0 && <View style={styles.sep} />}
                <MarkerRow def={MARKERS[k]} value={body.markers[k]} />
              </View>
            ))}
          </Card>
        </FadeIn>

        <Text style={styles.disclaimer}>
          ⚕️ This is an educational simulation, not medical advice. Always follow
          your own care team's guidance.
        </Text>
      </ScrollView>

      <OrganDetailSheet
        organKey={selectedOrgan}
        body={body}
        onClose={() => setSelectedOrgan(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4), gap: theme.space(3), paddingBottom: 40 },
  hero: {
    borderRadius: theme.radius.lg,
    padding: theme.space(5),
    ...theme.shadow,
  },
  greeting: { fontSize: 24, fontWeight: "800", color: "#fff" },
  heroSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  h2: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: theme.space(2),
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.space(4),
  },
  stat: { flex: 1, alignItems: "center" },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  statBig: { fontSize: 20, fontWeight: "800", color: "#fff" },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  xpHint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: theme.space(1.5),
    textAlign: "right",
  },
  sep: { height: 1, backgroundColor: theme.colors.border },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.subtext,
    lineHeight: 17,
    marginTop: theme.space(3),
    textAlign: "center",
  },
});
