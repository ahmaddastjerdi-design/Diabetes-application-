/**
 * CoachScreen.tsx — the in-app AI Health Coach (PRD Vol 2 / Vol 6).
 * A supportive, educational chat. Safety guardrails (red-flag escalation + dosing block)
 * run on-device via src/lib/coach.ts, so the coach is safe even offline. It never
 * diagnoses or advises doses.
 */
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { localCoachReply, CoachTier } from "../lib/coach";
import { theme } from "../theme";

interface Message {
  id: number;
  role: "user" | "coach";
  text: string;
  tier: CoachTier;
}

const GREETING: Message = {
  id: 0,
  role: "coach",
  text: "Hi! I'm your learning coach. Ask me how diet, activity, hydration or stress affect your body. For anything about your treatment, your care team is the right place.",
  tier: "none",
};

export function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const nextId = useRef(1);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: nextId.current++, role: "user", text, tier: "none" };
    const reply = localCoachReply(text);
    const coachMsg: Message = { id: nextId.current++, role: "coach", text: reply.text, tier: reply.tier };
    setMessages((prev) => [...prev, userMsg, coachMsg]);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Educational coach — not medical advice</Text>
      </View>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.bubble,
              m.role === "user" ? styles.user : styles.coach,
              m.tier === "tier3" && styles.urgent,
            ]}
          >
            {m.tier === "tier3" && <Text style={styles.urgentTag}>⚠️ Urgent</Text>}
            <Text style={[styles.bubbleText, m.role === "user" && styles.userText]}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about diet, activity, hydration…"
          placeholderTextColor={theme.colors.subtext}
          onSubmitEditing={send}
          returnKeyType="send"
          accessibilityLabel="Message the coach"
        />
        <Pressable onPress={send} style={styles.sendBtn} accessibilityRole="button">
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  banner: { backgroundColor: theme.colors.warn + "22", paddingVertical: theme.space(2), alignItems: "center" },
  bannerText: { fontSize: 12, color: theme.colors.warn, fontWeight: "700" },
  messages: { padding: theme.space(4), gap: theme.space(2.5), paddingBottom: theme.space(4) },
  bubble: { maxWidth: "85%", borderRadius: theme.radius.lg, padding: theme.space(3) },
  coach: { alignSelf: "flex-start", backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
  user: { alignSelf: "flex-end", backgroundColor: theme.colors.primary },
  urgent: { borderColor: theme.colors.bad, borderWidth: 2, backgroundColor: theme.colors.bad + "11" },
  urgentTag: { color: theme.colors.bad, fontWeight: "800", fontSize: 12, marginBottom: 4 },
  bubbleText: { fontSize: 14, color: theme.colors.text, lineHeight: 20 },
  userText: { color: "#fff" },
  inputRow: {
    flexDirection: "row",
    gap: theme.space(2),
    padding: theme.space(3),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space(3.5),
    paddingVertical: theme.space(3),
    color: theme.colors.text,
    fontSize: 14,
  },
  sendBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, paddingHorizontal: theme.space(4), justifyContent: "center" },
  sendText: { color: "#fff", fontWeight: "700" },
});
