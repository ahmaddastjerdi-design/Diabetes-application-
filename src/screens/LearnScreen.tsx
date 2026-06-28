/** LearnScreen.tsx — gamified micro-lessons with a closing check-question. */
import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { useGame } from "../state/GameContext";
import { LESSONS, LessonDef } from "../data/lessons";
import { Card, Button, ProgressBar } from "../components/ui";
import { theme } from "../theme";

export function LearnScreen() {
  const { completedLessons } = useGame();
  const [active, setActive] = useState<LessonDef | null>(null);

  if (active) {
    return <LessonFlow lesson={active} onExit={() => setActive(null)} />;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.h1}>Learn</Text>
      <Text style={styles.subtitle}>
        Short quests. Each one you finish earns XP and unlocks understanding.
      </Text>

      <Text style={styles.progressNote}>
        {completedLessons.length}/{LESSONS.length} lessons complete
      </Text>
      <ProgressBar
        value={completedLessons.length / LESSONS.length}
        color={theme.colors.primary}
      />

      {LESSONS.map((l) => {
        const done = completedLessons.includes(l.id);
        return (
          <Pressable key={l.id} onPress={() => setActive(l)}>
            <Card style={styles.lessonRow}>
              <Text style={styles.lessonEmoji}>{l.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.lessonTitle}>{l.title}</Text>
                <Text style={styles.lessonSummary}>{l.summary}</Text>
              </View>
              <Text style={styles.check}>{done ? "✅" : "▶️"}</Text>
            </Card>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function LessonFlow({
  lesson,
  onExit,
}: {
  lesson: LessonDef;
  onExit: () => void;
}) {
  const { completeLesson } = useGame();
  // step: 0..cards-1 = cards, cards = quiz, cards+1 = result
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<{
    xpGained: number;
    badges: string[];
  } | null>(null);

  const total = lesson.cards.length + 1;
  const isQuiz = step === lesson.cards.length;

  const onAnswer = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const passed = i === lesson.quiz.answerIndex;
    const res = completeLesson(lesson.id, passed);
    setResult({
      xpGained: res.xpGained,
      badges: res.newBadges.map((b) => `${b.emoji} ${b.label}`),
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={onExit}>
        <Text style={styles.back}>‹ All lessons</Text>
      </Pressable>
      <Text style={styles.h1}>
        {lesson.emoji} {lesson.title}
      </Text>
      <ProgressBar value={(step + 1) / total} color={theme.colors.primary} />

      {!isQuiz && (
        <Card style={styles.cardBody}>
          <Text style={styles.cardTitle}>{lesson.cards[step].title}</Text>
          <Text style={styles.cardText}>{lesson.cards[step].body}</Text>
          <Button label="Next" onPress={() => setStep(step + 1)} />
        </Card>
      )}

      {isQuiz && (
        <Card style={styles.cardBody}>
          <Text style={styles.cardTitle}>{lesson.quiz.prompt}</Text>
          {lesson.quiz.options.map((opt, i) => {
            const isAnswer = i === lesson.quiz.answerIndex;
            const chosen = picked === i;
            const reveal = picked !== null;
            return (
              <Pressable
                key={i}
                onPress={() => onAnswer(i)}
                style={[
                  styles.option,
                  reveal && isAnswer && styles.optionCorrect,
                  reveal && chosen && !isAnswer && styles.optionWrong,
                ]}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            );
          })}

          {result && (
            <View style={{ gap: theme.space(2), marginTop: theme.space(2) }}>
              <Text style={styles.explain}>
                {picked === lesson.quiz.answerIndex ? "✅ Correct! " : "💡 "}
                {lesson.quiz.explain}
              </Text>
              {result.xpGained > 0 && (
                <Text style={styles.xpGain}>+{result.xpGained} XP earned</Text>
              )}
              {result.badges.map((b) => (
                <Text key={b} style={styles.badge}>
                  🏅 {b}
                </Text>
              ))}
              <Button label="Finish" onPress={onExit} />
            </View>
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.space(4), gap: theme.space(3), paddingBottom: 40 },
  h1: { fontSize: 26, fontWeight: "800", color: theme.colors.text },
  subtitle: { fontSize: 14, color: theme.colors.subtext, marginTop: -8 },
  progressNote: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.subtext,
    marginTop: theme.space(1),
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space(3),
  },
  lessonEmoji: { fontSize: 32 },
  lessonTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  lessonSummary: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 2,
    lineHeight: 16,
  },
  check: { fontSize: 20 },
  back: { color: theme.colors.primary, fontWeight: "600", fontSize: 14 },
  cardBody: { gap: theme.space(3) },
  cardTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.text },
  cardText: { fontSize: 15, color: theme.colors.text, lineHeight: 22 },
  option: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.space(3.5),
    backgroundColor: "#fff",
  },
  optionCorrect: {
    borderColor: theme.colors.good,
    backgroundColor: theme.colors.good + "14",
  },
  optionWrong: {
    borderColor: theme.colors.bad,
    backgroundColor: theme.colors.bad + "14",
  },
  optionText: { fontSize: 15, color: theme.colors.text, fontWeight: "600" },
  explain: { fontSize: 14, color: theme.colors.text, lineHeight: 20 },
  xpGain: { fontSize: 15, fontWeight: "800", color: theme.colors.xp },
  badge: { fontSize: 14, fontWeight: "700", color: theme.colors.primaryDark },
});
