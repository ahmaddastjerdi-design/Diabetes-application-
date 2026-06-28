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
  ORGANS,
  deviation,
  initialBodyState,
} from "../engine/physiology";
import {
  ProgressState,
  initialProgress,
  levelFromXp,
} from "../engine/gamification";
import {
  GameSlice,
  LogResult,
  LessonResult,
  reduceLogAction,
  reduceCompleteLesson,
} from "../engine/gameLogic";
import { ActionDef, stepsToAction } from "../data/actions";
import { UserProfile, defaultProfile } from "../data/profile";
import { DailyGoalsState, freshGoals, todayKey } from "../data/goals";

const STORAGE_KEY = "diabetes-quest/v1";

interface PersistedState {
  version?: number;
  body: BodyState;
  progress: ProgressState;
  completedLessons: string[];
  profile?: UserProfile;
  lastStepSyncDay?: number;
  dailyGoals?: DailyGoalsState;
}

export type { LogResult, LessonResult };

export interface GameContextValue {
  body: BodyState;
  progress: ProgressState;
  completedLessons: string[];
  profile: UserProfile;
  ready: boolean;
  level: ReturnType<typeof levelFromXp>;
  inRangeCount: number;
  /** Today's daily-goal completion state (normalised to the current day). */
  goalsToday: DailyGoalsState;
  /** True once steps have been synced into the current simulated day. */
  stepsSyncedToday: boolean;
  /** Log an action: applies effects, awards XP, advances the day. */
  logAction: (action: ActionDef) => LogResult;
  /** Apply real Health Connect steps to the current day (once per sim-day). */
  logSteps: (steps: number) => LogResult | null;
  completeLesson: (lessonId: string, passedQuiz: boolean) => LessonResult;
  /** Persist the onboarding profile (also flips `onboarded` true). */
  saveProfile: (profile: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  reset: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [body, setBody] = useState<BodyState>(initialBodyState);
  const [progress, setProgress] = useState<ProgressState>(initialProgress);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [lastStepSyncDay, setLastStepSyncDay] = useState<number>(-1);
  const [dailyGoals, setDailyGoals] = useState<DailyGoalsState>(() =>
    freshGoals(todayKey())
  );
  const [ready, setReady] = useState(false);

  // Load persisted state once.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const p: PersistedState = JSON.parse(raw);
          if (p.body) {
            // Migration: backfill organ history for pre-history saves.
            const b = p.body;
            if (!b.history || b.history.length === 0) {
              b.history = [
                {
                  day: b.day,
                  heart: b.organs.heart,
                  kidney: b.organs.kidney,
                  glucose: b.markers.glucose,
                },
              ];
            }
            setBody(b);
          }
          if (p.progress) setProgress(p.progress);
          if (p.completedLessons) setCompletedLessons(p.completedLessons);
          // Migration: pre-onboarding saves have no profile -> stays default
          // (onboarded:false), so returning users see onboarding once.
          if (p.profile) setProfile(p.profile);
          if (typeof p.lastStepSyncDay === "number")
            setLastStepSyncDay(p.lastStepSyncDay);
          if (p.dailyGoals) setDailyGoals(p.dailyGoals);
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
    const payload: PersistedState = {
      version: 2,
      body,
      progress,
      completedLessons,
      profile,
      lastStepSyncDay,
      dailyGoals,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [
    body,
    progress,
    completedLessons,
    profile,
    lastStepSyncDay,
    dailyGoals,
    ready,
  ]);

  // Today's goals, normalised so a stale (yesterday's) record reads as empty.
  const goalsToday = useMemo<DailyGoalsState>(() => {
    const today = todayKey();
    return dailyGoals.date === today ? dailyGoals : freshGoals(today);
  }, [dailyGoals]);

  const inRangeCount = useMemo(
    () =>
      (Object.keys(body.markers) as MarkerKey[]).filter(
        (k) => deviation(k, body.markers[k]) === 0
      ).length,
    [body.markers]
  );

  const slice = (): GameSlice => ({
    body,
    progress,
    completedLessons,
    dailyGoals,
  });

  const logAction = useCallback<GameContextValue["logAction"]>(
    (action) => {
      const { next, result } = reduceLogAction(slice(), action, todayKey());
      setBody(next.body);
      setProgress(next.progress);
      if (next.dailyGoals !== dailyGoals) setDailyGoals(next.dailyGoals);
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [body, progress, completedLessons, dailyGoals]
  );

  const stepsSyncedToday = lastStepSyncDay === body.day;

  const logSteps = useCallback<GameContextValue["logSteps"]>(
    (steps) => {
      if (lastStepSyncDay === body.day) return null; // already synced this day
      const result = logAction(stepsToAction(steps));
      // logAction advanced the day by one; mark that new day as synced.
      setLastStepSyncDay(body.day + 1);
      return result;
    },
    [logAction, lastStepSyncDay, body.day]
  );

  const saveProfile = useCallback<GameContextValue["saveProfile"]>((p) => {
    setProfile({ ...p, onboarded: true });
  }, []);

  const updateProfile = useCallback<GameContextValue["updateProfile"]>(
    (partial) => setProfile((prev) => ({ ...prev, ...partial })),
    []
  );

  const completeLesson = useCallback<GameContextValue["completeLesson"]>(
    (lessonId, passedQuiz) => {
      const { next, result } = reduceCompleteLesson(
        slice(),
        lessonId,
        passedQuiz,
        todayKey()
      );
      setCompletedLessons(next.completedLessons);
      setProgress(next.progress);
      if (next.dailyGoals !== dailyGoals) setDailyGoals(next.dailyGoals);
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completedLessons, progress, body, dailyGoals]
  );

  const reset = useCallback(() => {
    // Resets the journey but keeps the patient's onboarding profile.
    setBody(initialBodyState());
    setProgress(initialProgress());
    setCompletedLessons([]);
    setLastStepSyncDay(-1);
    setDailyGoals(freshGoals(todayKey()));
  }, []);

  const level = useMemo(() => levelFromXp(progress.xp), [progress.xp]);

  const value: GameContextValue = {
    body,
    progress,
    completedLessons,
    profile,
    ready,
    level,
    inRangeCount,
    goalsToday,
    stepsSyncedToday,
    logAction,
    logSteps,
    completeLesson,
    saveProfile,
    updateProfile,
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
