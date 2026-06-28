/**
 * TutorialOverlay.tsx — a one-time, skippable "how it works" walkthrough shown
 * right after onboarding. Four quick cards that frame the core loop so a new
 * patient knows what to do before they start tapping.
 */
import React, { useState } from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { Button } from "./ui";
import { FadeIn } from "./anim";
import * as H from "../services/haptics";
import { theme } from "../theme";

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    emoji: "👋",
    title: "Welcome to your journey",
    body: "Diabetes Quest turns managing your health into a game you learn by playing. Here's the idea in 30 seconds.",
  },
  {
    emoji: "➕",
    title: "Log your choices",
    body: "On the Log tab, tap the meals, activity, and medicines from your day. Each choice instantly ripples through your body.",
  },
  {
    emoji: "❤️",
    title: "Watch your organs respond",
    body: "Your heart and kidneys react on the Home screen — healing on good days, straining on bad ones. Tap an organ for its trend and tips.",
  },
  {
    emoji: "🏅",
    title: "Learn & earn",
    body: "Finish short lessons, keep your streak, and unlock badges as you go. Ready to start?",
  },
];

export function TutorialOverlay({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const isLast = i === SLIDES.length - 1;

  const next = () => {
    H.tapLight();
    if (isLast) {
      H.celebrate();
      onDone();
    } else {
      setI((v) => v + 1);
    }
  };

  const skip = () => {
    H.tapLight();
    onDone();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={skip}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable style={styles.skip} onPress={skip} hitSlop={10}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>

          <FadeIn key={i} style={styles.slide}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </FadeIn>

          <View style={styles.dots}>
            {SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, idx === i && styles.dotActive]}
              />
            ))}
          </View>

          <Button label={isLast ? "Let's go!" : "Next"} onPress={next} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.space(6),
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: theme.radius.lg,
    padding: theme.space(6),
    width: "100%",
    maxWidth: 360,
    gap: theme.space(4),
  },
  skip: { position: "absolute", top: theme.space(3), right: theme.space(4), zIndex: 2 },
  skipText: { fontSize: 14, fontWeight: "600", color: theme.colors.subtext },
  slide: { alignItems: "center", gap: theme.space(2), paddingTop: theme.space(4) },
  emoji: { fontSize: 56 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    color: theme.colors.subtext,
    textAlign: "center",
    lineHeight: 22,
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: theme.space(2) },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: { backgroundColor: theme.colors.primary, width: 22 },
});
