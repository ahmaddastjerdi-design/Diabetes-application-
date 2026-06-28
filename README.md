# Diabetes Quest 🩺

A React Native (Expo) **Android** app that teaches patients — through gamified,
hands-on play — how their everyday choices around **diet, exercise, and
medication** ripple through their body and affect organs like the **heart** and
**kidneys**.

> ⚕️ **Educational only — not medical advice or a medical device.** The
> physiological model is an intentionally simplified teaching simulation. All
> content must be reviewed by a clinician before any real-world release.

---

## The idea

Most diabetes apps are trackers that bolt points onto logging. The differentiator
here is a **cause-and-effect organ simulation**: when the patient logs a sugary
drink, a walk, or a missed dose, they immediately *see* their glucose / blood
pressure / hydration / cholesterol move, and over days they watch their heart and
kidneys visibly heal or strain. The goal is an embodied, intuitive understanding
of "why my choices matter."

See [`DESIGN.md`](./DESIGN.md) for the research behind it and the full design.

## Core loop (MDA framework)

- **Mechanic** — log a daily action (diet / exercise / drug).
- **Dynamic** — actions move physiological markers; markers in/out of their
  healthy band slowly heal or damage organs over simulated days.
- **Aesthetic** — the patient sees their organs respond and understands the link.

Wrapped in a **Self-Determination-Theory** motivation layer (XP, levels, badges,
and a *forgiving* streak — see `DESIGN.md` for why punishing streaks backfire).

## App structure

A one-time **onboarding flow** personalizes the experience (name, condition,
medications, daily step goal) and offers to connect **Android Health Connect** so
real steps feed the simulation.

| Tab | Screen | Purpose |
|-----|--------|---------|
| 🩺 Home | `HomeScreen` | Personalized greeting, real step activity, organ health, live markers |
| ➕ Log | `LogScreen` | The core mechanic — log a choice (meds tailored to you), see the ripple |
| 📚 Learn | `LearnScreen` | Bite-size lesson quests + a check-question |
| 🏅 Profile | `ProfileScreen` | Edit personalization, badges, level summary, reset |

## Code map

```
App.tsx                     Navigation root + onboarding gate + providers
src/
  engine/
    physiology.ts           Organ-impact simulation (markers → organs)
    gamification.ts         XP, levels, badges, forgiving streak (SDT-based)
    __smoke__.ts            Runtime sanity checks for the engine
  data/
    actions.ts              Loggable diet/exercise/drug actions (+ steps→action)
    lessons.ts              Education quests + quizzes
    profile.ts              Onboarding options (conditions, meds, step goals)
  services/
    healthConnect.ts        Lazy, guarded Android Health Connect wrapper
    useHealthConnect.ts     Hook: status, permission, today's steps
    haptics.ts              Guarded expo-haptics wrapper
  state/
    GameContext.tsx         Single source of truth, persisted via AsyncStorage
  components/
    anim.tsx                CountUp, AnimatedBar, FadeIn, Pop primitives
    RewardLayer.tsx         App-wide XP toast + badge/level-up celebration
    BodyDiagram.tsx         SVG body whose organs tint by health + heartbeat
    CausalChain.tsx         Animated choice → markers → organs flow
    Sparkline.tsx           SVG organ-health trend line
    OrganDetailSheet.tsx    Tap an organ → trend, what's affecting it, tips
    GoalsCard.tsx           Today's daily goals (the daily hook)
    A1cCard.tsx             Estimated long-term HbA1c from glucose history
    TutorialOverlay.tsx     One-time "how it works" walkthrough
    OrganCard, MarkerRow, ActivityCard, ui.tsx (UI primitives)
  screens/                  Onboarding, Home, Log, Learn, Profile
  theme.ts                  Design tokens
```

### Experience / "game feel"

The app leans on tactile + motion feedback to feel responsive and rewarding:

- **Living body diagram** (`react-native-svg`) — the dashboard centerpiece: a
  body silhouette whose heart and kidneys tint by their current health, with a
  gentle pulsing heartbeat. The organ-impact concept made visual.
- **Animated causal chain** — after you log a choice, a `choice → markers →
  organs` flow fades in link by link, teaching the mechanism, not just the score.
- **Organ detail sheet** — tap any organ (or the body legend) for a bottom sheet
  with a health-trend sparkline, what's affecting it right now, and concrete tips
  for whatever is out of range.
- **Guided first session** — a one-time, skippable walkthrough frames the core
  loop for new patients (replayable from the Profile tab).
- **Haptics** (`expo-haptics`) on every meaningful interaction — light taps for
  logging, success/warning buzzes that mirror whether a choice helped or hurt.
- **Animated everything** (RN `Animated`, no native config): counting numbers,
  filling bars, staggered card entrances, and a press "pop".
- **Reward moments** — a sliding **+XP toast** plus a queued **celebration
  overlay** (with an emoji burst) for badge unlocks and level-ups, fired from one
  central `RewardProvider` so every screen stays simple.
- **Polish** — a gradient dashboard hero, safe-area handling on every screen, a
  tab bar that respects the home indicator, and respect for the OS
  "reduce motion" setting.

### Health Connect (real step data)

Reading steps uses [`react-native-health-connect`](https://github.com/matinzd/react-native-health-connect)
and is **Android-only, requiring a development build** (it does not work in Expo
Go or on web). The app degrades gracefully when it's unavailable. To try it:

```bash
npx expo run:android        # builds a dev client with the native module
```

You also need the Health Connect app installed on the device (Android 14+ has it
built in; older versions install it from the Play Store).

## Getting started

```bash
npm install
npm run typecheck     # tsc --noEmit
npm run smoke         # validates the simulation behaves correctly
npm run android       # run on an Android device/emulator via Expo
```

You need [Expo](https://docs.expo.dev/) tooling and an Android emulator or the
Expo Go app on a physical device. Tech: Expo SDK 56, React Native 0.85, React 19,
React Navigation 7, TypeScript.

## Status

This is a **working vertical-slice prototype**: the simulation, gamification,
lessons, and persistence all function end-to-end. It is a foundation to validate
the concept, not a finished product. See [`DESIGN.md`](./DESIGN.md#roadmap) for
the roadmap (clinician review, Health Connect integration, real data sync, etc.).
