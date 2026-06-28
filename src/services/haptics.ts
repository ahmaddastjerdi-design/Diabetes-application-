/**
 * haptics.ts — tiny, safe wrapper around expo-haptics.
 *
 * Tactile feedback is one of the cheapest, highest-impact ways to make an app
 * feel responsive. Every call is fire-and-forget and guarded so it never throws
 * (haptics are a no-op on web and on devices without a vibrator).
 */
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const enabled = Platform.OS === "ios" || Platform.OS === "android";

/** Light tap — for routine taps like logging an action. */
export function tapLight() {
  if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Medium tap — for selections that change state. */
export function tapMedium() {
  if (enabled)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Success buzz — correct answer, marker came into range. */
export function notifySuccess() {
  if (enabled)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
}

/** Warning buzz — wrong answer, a harmful choice. */
export function notifyWarning() {
  if (enabled)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {}
    );
}

/** Celebratory double-buzz — badge unlocked or level up. */
export function celebrate() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {}
  );
}
