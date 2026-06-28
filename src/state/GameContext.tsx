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
import { ActionDef, stepsToAction } from "../data/actions";
import { UserProfile, defaultProfile } from "../data/profile";

const STORAGE_KEY = "diabetes-quest/v1";

interface PersistedState {
  version?: number;
  body: BodyState;
  progress: ProgressState;
  completedLessons: string[];
  profile?: UserProfile;
  lastStepSyncDay?: number;
}

export interface LogResult {
  organDelta: Record<OrganKey, number>;
  newBadges: BadgeDef[];
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
}

export interface LessonResult {
  newBadges: BadgeDef[];
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
}

export interface GameContextValue {
  body: BodyState;
  progress: ProgressState;
  completedLessons: string[];
  profile: UserProfile;
  ready: boolean;
  level: ReturnType<typeof levelFromXp>;
  inRangeCount: number;
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
                { day: b.day, heart: b.organs.heart, kidney: b.organs.kidney },
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
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [body, progress, completedLessons, profile, lastStepSyncDay, ready]);

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

      const prevLevel = levelFromXp(progress.xp).level;
      const newLevel = levelFromXp(reconciled.progress.xp).level;

      return {
        organDelta,
        newBadges: reconciled.newlyEarned,
        xpGained,
        leveledUp: newLevel > prevLevel,
        newLevel,
      };
    },
    [body, progress, completedLessons.length, badgeCtx]
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

      if (!already) setCompletedLessons(lessons);
      setProgress(reconciled.progress);

      const prevLevel = levelFromXp(progress.xp).level;
      const newLevel = levelFromXp(reconciled.progress.xp).level;

      return {
        newBadges: reconciled.newlyEarned,
        xpGained,
        leveledUp: newLevel > prevLevel,
        newLevel,
      };
    },
    [completedLessons, progress, body, inRangeCount, badgeCtx]
  );

  const reset = useCallback(() => {
    // Resets the journey but keeps the patient's onboarding profile.
    setBody(initialBodyState());
    setProgress(initialProgress());
    setCompletedLessons([]);
    setLastStepSyncDay(-1);
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
