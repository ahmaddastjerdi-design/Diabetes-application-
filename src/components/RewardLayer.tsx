/**
 * RewardLayer.tsx — app-wide juicy feedback for earning things.
 *
 * Exposes `useReward().celebrate(...)`. Renders:
 *   - a sliding "+XP" toast at the top, and
 *   - a queued celebration overlay for level-ups and each new badge,
 * each paired with the right haptic. Centralising this keeps screens simple:
 * they just report what was earned and the layer handles the show.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BadgeDef } from "../engine/gamification";
import { theme } from "../theme";
import * as H from "../services/haptics";

export interface CelebratePayload {
  xpGained?: number;
  newBadges?: BadgeDef[];
  leveledUp?: boolean;
  newLevel?: number;
}

type Item =
  | { kind: "level"; level: number }
  | { kind: "badge"; badge: BadgeDef };

interface RewardContextValue {
  celebrate: (p: CelebratePayload) => void;
}

const RewardContext = createContext<RewardContextValue | null>(null);

export function RewardProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  // --- XP toast ---
  const [toast, setToast] = useState<string | null>(null);
  const toastY = useRef(new Animated.Value(-80)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (text: string) => {
      setToast(text);
      Animated.spring(toastY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
        tension: 80,
      }).start();
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => {
        Animated.timing(toastY, {
          toValue: -80,
          duration: 280,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, 1500);
    },
    [toastY]
  );

  // --- Celebration overlay queue ---
  const [queue, setQueue] = useState<Item[]>([]);
  const [current, setCurrent] = useState<Item | null>(null);
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
    }
  }, [current, queue]);

  useEffect(() => {
    if (current) {
      overlay.setValue(0);
      H.celebrate();
      Animated.spring(overlay, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 70,
      }).start();
    }
  }, [current, overlay]);

  const dismiss = useCallback(() => {
    Animated.timing(overlay, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setCurrent(null));
  }, [overlay]);

  const celebrate = useCallback(
    (p: CelebratePayload) => {
      if (p.xpGained && p.xpGained > 0) {
        H.tapLight();
        showToast(`+${p.xpGained} XP`);
      }
      const items: Item[] = [];
      if (p.leveledUp && p.newLevel)
        items.push({ kind: "level", level: p.newLevel });
      for (const b of p.newBadges ?? []) items.push({ kind: "badge", badge: b });
      if (items.length) setQueue((q) => [...q, ...items]);
    },
    [showToast]
  );

  const scale = overlay.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <RewardContext.Provider value={{ celebrate }}>
      {children}

      {/* XP toast */}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { top: insets.top + 8, transform: [{ translateY: toastY }] },
          ]}
        >
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}

      {/* Celebration overlay */}
      <Modal visible={!!current} transparent animationType="fade" onRequestClose={dismiss}>
        <Pressable style={styles.backdrop} onPress={dismiss}>
          <Animated.View
            style={[styles.celebrateCard, { opacity: overlay, transform: [{ scale }] }]}
          >
            <EmojiBurst show={!!current} />
            {current?.kind === "level" ? (
              <>
                <Text style={styles.bigEmoji}>⭐️</Text>
                <Text style={styles.celebrateTitle}>Level {current.level}!</Text>
                <Text style={styles.celebrateBody}>
                  You're getting stronger at managing your health. Keep it up!
                </Text>
              </>
            ) : current?.kind === "badge" ? (
              <>
                <Text style={styles.bigEmoji}>{current.badge.emoji}</Text>
                <Text style={styles.celebrateTitle}>Badge unlocked!</Text>
                <Text style={styles.celebrateBadgeName}>{current.badge.label}</Text>
                <Text style={styles.celebrateBody}>{current.badge.description}</Text>
              </>
            ) : null}
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Tap to continue</Text>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </RewardContext.Provider>
  );
}

/** A few emoji that fan outward when the overlay appears. */
function EmojiBurst({ show }: { show: boolean }) {
  const EMOJI = ["🎉", "✨", "💪", "🎊", "⭐️", "🌟"];
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!show) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [show, progress]);

  return (
    <View pointerEvents="none" style={styles.burst}>
      {EMOJI.map((e, i) => {
        const angle = (Math.PI * 2 * i) / EMOJI.length;
        const tx = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(angle) * 90],
        });
        const ty = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(angle) * 90],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [0, 1, 0],
        });
        return (
          <Animated.Text
            key={i}
            style={[
              styles.burstEmoji,
              { opacity, transform: [{ translateX: tx }, { translateY: ty }] },
            ]}
          >
            {e}
          </Animated.Text>
        );
      })}
    </View>
  );
}

export function useReward(): RewardContextValue {
  const ctx = useContext(RewardContext);
  if (!ctx) throw new Error("useReward must be used within a RewardProvider");
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: theme.colors.xp,
    paddingHorizontal: theme.space(5),
    paddingVertical: theme.space(2.5),
    borderRadius: theme.radius.pill,
    ...theme.shadow,
    elevation: 6,
    zIndex: 1000,
  },
  toastText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.space(6),
  },
  celebrateCard: {
    backgroundColor: "#fff",
    borderRadius: theme.radius.lg,
    padding: theme.space(6),
    alignItems: "center",
    gap: theme.space(2),
    width: "100%",
    maxWidth: 340,
  },
  burst: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  burstEmoji: { position: "absolute", fontSize: 26 },
  bigEmoji: { fontSize: 64, marginBottom: theme.space(1) },
  celebrateTitle: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  celebrateBadgeName: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  celebrateBody: {
    fontSize: 14,
    color: theme.colors.subtext,
    textAlign: "center",
    lineHeight: 20,
  },
  tapHint: { marginTop: theme.space(3) },
  tapHintText: { fontSize: 12, color: theme.colors.subtext },
});
