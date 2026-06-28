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

| Tab | Screen | Purpose |
|-----|--------|---------|
| 🩺 Home | `HomeScreen` | Dashboard: level, streak, organ health, live markers |
| ➕ Log | `LogScreen` | The core mechanic — log a choice, see the ripple |
| 📚 Learn | `LearnScreen` | Bite-size lesson quests + a check-question |
| 🏅 Profile | `ProfileScreen` | Badges, level summary, reset |

## Code map

```
App.tsx                     Navigation root (bottom tabs) + providers
src/
  engine/
    physiology.ts           Organ-impact simulation (markers → organs)
    gamification.ts         XP, levels, badges, forgiving streak (SDT-based)
    __smoke__.ts            Runtime sanity checks for the engine
  data/
    actions.ts              Catalog of loggable diet/exercise/drug actions
    lessons.ts              Education quests + quizzes
  state/
    GameContext.tsx         Single source of truth, persisted via AsyncStorage
  components/               OrganCard, MarkerRow, shared UI primitives
  screens/                  Home, Log, Learn, Profile
  theme.ts                  Design tokens
```

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
