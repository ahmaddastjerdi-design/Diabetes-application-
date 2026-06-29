/**
 * GameContext.tsx — single source of truth for the patient's journey.
 *
 * Holds the simulated body, gamification progress, and lesson completion, and
 * persists everything to AsyncStorage so progress survives app restarts.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  BodyState,
  MarkerKey,
  OrganKey,
  ORGANS,
  advanceDay,
  applyActionEffects,
  deviation,
  initialBodyState,
} from "../engine/physiology";
import {
  ProgressState,
  XP,
  BadgeDef,
  initialProgress,
  levelFromXp,
  reconcileBadges,
  registerActivity,
} from "../engine/gamification";
import { ActionDef } from "../data/actions";
import { GlucoseUnit } from "../lib/units";
import { DeviceKind } from "../lib/health";
import { OutboxItem } from "../lib/sync";

const STORAGE_KEY = "diabetes-quest/v1";

export type ConditionType = "type1" | "type2" | "prediabetes" | "gestational" | "other";

/** Patient profile captured at onboarding (PRD Vol 2: onboarding & personalization). */
export interface Profile {
  onboarded: boolean;
  consentAccepted: boolean;
  conditionType: ConditionType;
  glucoseUnit: GlucoseUnit;
  remindersEnabled: boolean;
  /** Stable per-install patient id used as the backend subject (Vol 4). */
  patientId: string;
  /** Opt-in cloud sync to the platform backend. */
  syncEnabled: boolean;
  backendUrl: string;
}

export function initialProfile(): Profile {
  return {
    onboarded: false,
    consentAccepted: false,
    conditionType: "type2",
    glucoseUnit: "mg/dL",
    remindersEnabled: true,
    patientId: "",
    syncEnabled: false,
    backendUrl: "",
  };
}

/** A device the patient has paired (PRD Vol 2 / Vol 5 device management). */
export interface PairedDevice {
  id: string;
  kind: DeviceKind;
  name: string;
  pairedAt: number;
}

/** A vital-sign reading: glucose (mgdl) or blood pressure (systolic/diastolic). */
export interface Reading {
  id: string;
  atMs: number;
  source: "manual" | "device";
  /** Defaults to "glucose" for older stored readings that predate this field. */
  kind?: "glucose" | "bp";
  mgdl?: number;
  systolic?: number;
  diastolic?: number;
}

/** A lab/body measurement keyed by a MetricDef (see src/data/metrics.ts). */
export interface Measurement {
  id: string;
  metricKey: string;
  value: number;
  atMs: number;
  source: "manual" | "device";
}

interface PersistedState {
  body: BodyState;
  progress: ProgressState;
  completedLessons: string[];
  profile?: Profile;
  pairedDevices?: PairedDevice[];
  readings?: Reading[];
  reminders?: string[];
  outbox?: OutboxItem[];
  myMedications?: string[];
  measurements?: Measurement[];
}

export interface GameContextValue {
  body: BodyState;
  progress: ProgressState;
  completedLessons: string[];
  profile: Profile;
  pairedDevices: PairedDevice[];
  readings: Reading[];
  reminders: string[];
  outbox: OutboxItem[];
  myMedications: string[];
  measurements: Measurement[];
  ready: boolean;
  level: ReturnType<typeof levelFromXp>;
  inRangeCount: number;
  /** Finish onboarding with the chosen profile settings. */
  completeOnboarding: (settings: Partial<Profile>) => void;
  /** Update one or more profile fields (Settings). */
  updateProfile: (partial: Partial<Profile>) => void;
  pairDevice: (kind: DeviceKind, name: string) => void;
  unpairDevice: (id: string) => void;
  addReading: (mgdl: number, source: Reading["source"]) => void;
  addBpReading: (systolic: number, diastolic: number, source: Reading["source"]) => void;
  addMeasurement: (metricKey: string, value: number, source: Measurement["source"]) => void;
  toggleReminder: (slotId: string) => void;
  toggleMedication: (drugId: string) => void;
  /** Remove outbox events the backend has accepted. */
  markSynced: (ids: string[]) => void;
  /** Log an action: applies effects, awards XP, advances the day. */
  logAction: (action: ActionDef) => {
    organDelta: Record<OrganKey, number>;
    newBadges: BadgeDef[];
    xpGained: number;
  };
  completeLesson: (lessonId: string, passedQuiz: boolean) => {
    newBadges: BadgeDef[];
    xpGained: number;
  };
  reset: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [body, setBody] = useState<BodyState>(initialBodyState);
  const [progress, setProgress] = useState<ProgressState>(initialProgress);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [myMedications, setMyMedications] = useState<string[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [ready, setReady] = useState(false);

  // Load persisted state once.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const p: PersistedState = JSON.parse(raw);
          if (p.body) setBody(p.body);
          if (p.progress) setProgress(p.progress);
          if (p.completedLessons) setCompletedLessons(p.completedLessons);
          if (p.profile) setProfile({ ...initialProfile(), ...p.profile });
          if (p.pairedDevices) setPairedDevices(p.pairedDevices);
          if (p.readings) setReadings(p.readings);
          if (p.reminders) setReminders(p.reminders);
          if (p.outbox) setOutbox(p.outbox);
          if (p.myMedications) setMyMedications(p.myMedications);
          if (p.measurements) setMeasurements(p.measurements);
        }
      } catch {
        // start fresh on any corruption
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Persist on every change (after initial load).
  useEffect(() => {
    if (!ready) return;
    const payload: PersistedState = { body, progress, completedLessons, profile, pairedDevices, readings, reminders, outbox, myMedications, measurements };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [body, progress, completedLessons, profile, pairedDevices, readings, reminders, outbox, myMedications, measurements, ready]);

  const inRangeCount = useMemo(
    () =>
      (Object.keys(body.markers) as MarkerKey[]).filter(
        (k) => deviation(k, body.markers[k]) === 0
      ).length,
    [body.markers]
  );

  const badgeCtx = useCallback(
    (b: BodyState, pr: ProgressState, lessons: number, inRange: number) => ({
      progress: pr,
      organs: b.organs,
      lessonsCompleted: lessons,
      inRangeMarkers: inRange,
    }),
    []
  );

  const logAction = useCallback<GameContextValue["logAction"]>(
    (action) => {
      // 1. Immediate marker effects, then advance one simulated day.
      const afterEffects = applyActionEffects(body, action.effects);
      const { next, organDelta } = advanceDay(afterEffects);

      // 2. XP: base for logging + bonus if every marker ended in range.
      const allInRange = (Object.keys(next.markers) as MarkerKey[]).every(
        (k) => deviation(k, next.markers[k]) === 0
      );
      let xpGained = XP.logAction + (allInRange ? XP.dailyAllMarkersInRange : 0);

      // 3. Streak + XP into progress.
      const activity = registerActivity(progress, next.day);
      let nextProgress: ProgressState = {
        ...activity.progress,
        xp: activity.progress.xp + xpGained,
      };

      // 4. Badges.
      const inRange = (Object.keys(next.markers) as MarkerKey[]).filter(
        (k) => deviation(k, next.markers[k]) === 0
      ).length;
      const reconciled = reconcileBadges(
        nextProgress,
        badgeCtx(next, nextProgress, completedLessons.length, inRange)
      );

      setBody(next);
      setProgress(reconciled.progress);

      // Record the domain event for backend sync (server re-derives progress from these).
      const eventId = `e-${next.day}-${Date.now()}`;
      setOutbox((prev) => [
        ...prev,
        { id: eventId, event: { type: "action_logged", day: next.day, allMarkersInRange: allInRange } },
      ]);

      return { organDelta, newBadges: reconciled.newlyEarned, xpGained };
    },
    [body, progress, completedLessons.length, badgeCtx]
  );

  const completeLesson = useCallback<GameContextValue["completeLesson"]>(
    (lessonId, passedQuiz) => {
      const already = completedLessons.includes(lessonId);
      const lessons = already
        ? completedLessons
        : [...completedLessons, lessonId];

      const xpGained = already
        ? 0
        : XP.completeLesson + (passedQuiz ? XP.passQuiz : 0);

      let nextProgress: ProgressState = {
        ...progress,
        xp: progress.xp + xpGained,
      };
      const reconciled = reconcileBadges(
        nextProgress,
        badgeCtx(body, nextProgress, lessons.length, inRangeCount)
      );

      if (!already) {
        setCompletedLessons(lessons);
        setOutbox((prev) => [
          ...prev,
          { id: `e-lesson-${lessonId}`, event: { type: "lesson_completed", lessonId, passedQuiz } },
        ]);
      }
      setProgress(reconciled.progress);

      return { newBadges: reconciled.newlyEarned, xpGained };
    },
    [completedLessons, progress, body, inRangeCount, badgeCtx]
  );

  const completeOnboarding = useCallback<GameContextValue["completeOnboarding"]>((settings) => {
    setProfile({ ...initialProfile(), ...settings, onboarded: true, patientId: `p-${Date.now()}` });
  }, []);

  const markSynced = useCallback<GameContextValue["markSynced"]>((ids) => {
    const done = new Set(ids);
    setOutbox((prev) => prev.filter((item) => !done.has(item.id)));
  }, []);

  const updateProfile = useCallback<GameContextValue["updateProfile"]>((partial) => {
    setProfile((prev) => ({ ...prev, ...partial }));
  }, []);

  const pairDevice = useCallback<GameContextValue["pairDevice"]>((kind, name) => {
    const id = `${kind}-${Date.now()}`;
    setPairedDevices((prev) => [...prev, { id, kind, name, pairedAt: Date.now() }]);
  }, []);

  const unpairDevice = useCallback<GameContextValue["unpairDevice"]>((id) => {
    setPairedDevices((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const addReading = useCallback<GameContextValue["addReading"]>((mgdl, source) => {
    const r: Reading = { id: `r-${Date.now()}`, kind: "glucose", mgdl, atMs: Date.now(), source };
    setReadings((prev) => [r, ...prev].slice(0, 400));
  }, []);

  const addBpReading = useCallback<GameContextValue["addBpReading"]>((systolic, diastolic, source) => {
    const r: Reading = { id: `bp-${Date.now()}`, kind: "bp", systolic, diastolic, atMs: Date.now(), source };
    setReadings((prev) => [r, ...prev].slice(0, 400));
  }, []);

  const addMeasurement = useCallback<GameContextValue["addMeasurement"]>((metricKey, value, source) => {
    const m: Measurement = { id: `m-${Date.now()}`, metricKey, value, atMs: Date.now(), source };
    setMeasurements((prev) => [m, ...prev].slice(0, 800));
  }, []);

  const toggleReminder = useCallback<GameContextValue["toggleReminder"]>((slotId) => {
    setReminders((prev) => (prev.includes(slotId) ? prev.filter((s) => s !== slotId) : [...prev, slotId]));
  }, []);

  const toggleMedication = useCallback<GameContextValue["toggleMedication"]>((drugId) => {
    setMyMedications((prev) => (prev.includes(drugId) ? prev.filter((d) => d !== drugId) : [...prev, drugId]));
  }, []);

  const reset = useCallback(() => {
    setBody(initialBodyState());
    setProgress(initialProgress());
    setCompletedLessons([]);
    // Onboarding/profile is intentionally kept so a reset doesn't re-onboard the user.
  }, []);

  const level = useMemo(() => levelFromXp(progress.xp), [progress.xp]);

  const value: GameContextValue = {
    body,
    progress,
    completedLessons,
    profile,
    pairedDevices,
    readings,
    reminders,
    outbox,
    myMedications,
    ready,
    level,
    inRangeCount,
    completeOnboarding,
    updateProfile,
    pairDevice,
    unpairDevice,
    addReading,
    addBpReading,
    addMeasurement,
    toggleReminder,
    toggleMedication,
    markSynced,
    logAction,
    completeLesson,
    reset,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}

export { ORGANS };
