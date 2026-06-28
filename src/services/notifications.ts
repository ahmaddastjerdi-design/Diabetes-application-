/**
 * notifications.ts — local medication reminders.
 *
 * Medication adherence is one of the best-evidenced levers in diabetes care, so
 * a gentle daily reminder is high-value. These are LOCAL notifications (no
 * server). Reliable scheduling needs a development build; in Expo Go on Android
 * it may be limited — so every call is guarded and the UI degrades gracefully.
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const CHANNEL_ID = "medication";

let configured = false;

/** Call once on app start: foreground handler + Android channel. */
export async function configureNotifications() {
  if (configured || Platform.OS === "web") return;
  configured = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Medication reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  } catch {
    // best-effort
  }
}

/** Ask for notification permission. Returns true if granted. */
export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

/**
 * Schedule a single daily medication reminder at the given local time, replacing
 * any previously scheduled one. Returns true on success.
 */
export async function scheduleMedicationReminder(
  hour: number,
  minute: number,
  body: string
): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    await cancelMedicationReminder();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "💊 Medication reminder",
        body,
        ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return true;
  } catch {
    return false;
  }
}

/** Cancel all scheduled reminders (the app only schedules the one). */
export async function cancelMedicationReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
