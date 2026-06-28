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

const STORAGE_KEY = "diabetes-quest/v1";

export type ConditionType = "type1" | "type2" | "prediabetes" | "gestational" | "other";

/** Patient profile captured at onboarding (PRD Vol 2: onboarding & personalization). */
export interface Profile {
  onboarded: boolean;
  consentAccepted: boolean;
  conditionType: ConditionType;
  glucoseUnit: GlucoseUnit;
  remindersEnabled: boolean;
}

export function initialProfile(): Profile {
  return {
    onboarded: false,
    consentAccepted: false,
    conditionType: "type2",
    glucoseUnit: "mg/dL",
    remindersEnabled: true,
  };
}

interface PersistedState {
  body: BodyState;
  progress: ProgressState;
  completedLessons: string[];
  profile?: Profile;
}

export interface GameContextValue {
  body: BodyState;
  progress: ProgressState;
  completedLessons: string[];
  profile: Profile;
  ready: boolean;
  level: ReturnType<typeof levelFromXp>;
  inRangeCount: number;
  /** Finish onboarding with the chosen profile settings. */
  completeOnboarding: (settings: Omit<Profile, "onboarded">) => void;
  /** Update one or more profile fields (Settings). */
  updateProfile: (partial: Partial<Profile>) => void;
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
    const payload: PersistedState = { body, progress, completedLessons, profile };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [body, progress, completedLessons, profile, ready]);

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

      if (!already) setCompletedLessons(lessons);
      setProgress(reconciled.progress);

      return { newBadges: reconciled.newlyEarned, xpGained };
    },
    [completedLessons, progress, body, inRangeCount, badgeCtx]
  );

  const completeOnboarding = useCallback<GameContextValue["completeOnboarding"]>((settings) => {
    setProfile({ ...settings, onboarded: true });
  }, []);

  const updateProfile = useCallback<GameContextValue["updateProfile"]>((partial) => {
    setProfile((prev) => ({ ...prev, ...partial }));
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
    ready,
    level,
    inRangeCount,
    completeOnboarding,
    updateProfile,
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
