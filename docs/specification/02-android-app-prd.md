# Volume 2 — Android Application PRD

_Part of the Diabetes Quest Specification Suite — Volume 2 of 10._

## Abstract

This volume is the detailed product requirements document (PRD) for the **patient-facing Diabetes Quest Android application**. It specifies the information architecture, screen-by-screen behaviour, core user workflows, functional and non-functional requirements, data model, notifications, offline/sync behaviour, error handling, accessibility, localization, and telemetry for the app.

The document is grounded in the current working prototype — an Expo / React Native 0.85 / React 19 / TypeScript vertical slice with four screens (Home, Log, Learn, Profile), an organ-impact simulation engine (`src/engine/physiology.ts`), a Self-Determination-Theory gamification layer (`src/engine/gamification.ts`), and AsyncStorage persistence via a single `GameContext`. Today the app is **educational only** and stores all state on-device. This PRD describes both that current reality and the planned evolution toward onboarding/consent, device pairing (Health Connect + CGM), an AI Coach chat, medication reminders, and a synced backend — while holding the product's consistency anchors: Android-first, organ-impact visualization as the differentiator, SDT motivation with forgiving streaks, Material Design 3, HL7 FHIR R4, OAuth2/OIDC, HIPAA/GDPR/ISO 27001, OWASP MASVS, and an AI that never diagnoses or prescribes.

Requirements are written with stable identifiers (`FR-AND-###`) and acceptance criteria so they can be traced into design (Volume 7), backend (Volume 4), and QA (Volume 9).

## Table of contents

1. [Overview & scope](#1-overview--scope)
2. [Platform & Health Connect requirements](#2-platform--health-connect-requirements)
3. [Information architecture & navigation map](#3-information-architecture--navigation-map)
4. [Screen-by-screen specification](#4-screen-by-screen-specification)
5. [Core workflows](#5-core-workflows)
6. [Functional requirements](#6-functional-requirements)
7. [Data model & persistence](#7-data-model--persistence)
8. [Notifications & reminders](#8-notifications--reminders)
9. [Offline behaviour & sync](#9-offline-behaviour--sync)
10. [Error states & edge cases](#10-error-states--edge-cases)
11. [Accessibility & localization](#11-accessibility--localization)
12. [Analytics & telemetry](#12-analytics--telemetry)
13. [Non-functional requirements](#13-non-functional-requirements)
14. [Traceability & cross-references](#14-traceability--cross-references)

---

## 1. Overview & scope

### 1.1 Product summary

Diabetes Quest is a gamified diabetes self-management learning app. Its differentiator is **organ-impact visualization**: when a patient logs a choice (a sugary drink, a 30-minute walk, a missed dose), the app immediately moves physiological markers — blood glucose, systolic blood pressure, hydration, LDL cholesterol — and shows how those markers heal or strain the **heart** and **kidneys** over simulated days. A Self-Determination-Theory motivation layer (XP, gentle quadratic levels, badges, and a *forgiving* streak) carries the patient through the friction-heavy early weeks until the behaviour becomes intrinsically rewarding.

### 1.2 In scope for this volume

- The patient-facing Android app: UI, navigation, screen behaviour, local data model, and the contract it expects from the backend, devices, and AI.
- Both **current** (shipped prototype) and **planned** (roadmap) capabilities, clearly labelled.

### 1.3 Out of scope (delegated to sibling volumes)

- Visual design system, Material Design 3 tokens, component anatomy, motion → **Volume 7**.
- Backend services, sync protocol, FHIR mapping, identity → **Volume 4**.
- CGM/Health Connect integration internals, device data normalization → **Volume 5**.
- AI Coach model, prompting, guardrails, safety → **Volume 6**.
- Security controls, threat model, MASVS mapping → **Volume 8**.
- Test strategy and acceptance test suites → **Volume 9**.

### 1.4 Capability maturity legend

| Tag | Meaning |
|-----|---------|
| **[NOW]** | Implemented in the current prototype. |
| **[NEXT]** | Planned near-term (this PRD specifies it fully). |
| **[LATER]** | Roadmap; specified at intent level only. |

### 1.5 Standing product constraints

- **Educational, not a medical device.** The simulation is directionally faithful, never predictive of an individual's real values. A persistent disclaimer is required on the dashboard (**[NOW]**, see `HomeScreen.tsx`).
- **AI never diagnoses or prescribes.** The AI Coach explains, motivates, and points to the patient's own care team — never gives a diagnosis, dose, or titration.
- **Android-first.** iOS is not in scope for this suite.

---

## 2. Platform & Health Connect requirements

### 2.1 Runtime & build

| Item | Value |
|------|-------|
| Framework | Expo SDK 56, React Native 0.85, React 19 |
| Language | TypeScript (strict) |
| Navigation | React Navigation 7 (bottom tabs) |
| Persistence (current) | `@react-native-async-storage/async-storage`, key `diabetes-quest/v1` |
| Distribution | Google Play (managed Expo / EAS build) |

### 2.2 Android version targets

| Property | Target | Rationale |
|----------|--------|-----------|
| `minSdkVersion` | **26 (Android 8.0)** | Floor for the RN/Expo toolchain and notification channels. |
| `targetSdkVersion` | **35 (Android 15)** | Google Play current-target policy compliance. |
| `compileSdkVersion` | 35 | Matches target. |
| Health Connect SDK | Android 14+ on-device; provided via Play Store on Android 13 | Health Connect is the supported Android health data layer. |

Devices below the Health Connect floor must run the full app **except** device-sourced auto-logging; manual logging, lessons, simulation, and gamification remain fully functional (graceful degradation, see [§9](#9-offline-behaviour--sync)).

### 2.3 Health Connect requirements **[NEXT]**

- The app integrates with **Android Health Connect** (via `react-native-health-connect`) to read activity and vitals and to write its own activity records.
- **Read** permissions (requested incrementally, only when the patient opts into auto-logging): `Steps`, `TotalCaloriesBurned`, `ExerciseSession`, `BloodGlucose`, `BloodPressure`, `HeartRate`, `Hydration`.
- **Write** permissions: `ExerciseSession`, `Hydration` (so logged in-app actions can flow back out, opt-in).
- Permissions follow Health Connect's runtime model: rationale screen → system permission sheet → revocable any time in Settings. The app must function with **any subset** granted.
- Health Connect data is treated as **suggestions to confirm**, never silently scored, so the patient stays in the autonomy-supporting loop required by SDT.

### 2.4 Runtime permissions summary

| Permission | When requested | Degradation if denied |
|------------|----------------|------------------------|
| `POST_NOTIFICATIONS` (Android 13+) | First time a reminder is enabled | Reminders disabled; in-app nudges only. |
| Health Connect reads | On opt-in to auto-log/CGM | Manual logging only. |
| Bluetooth (`BLUETOOTH_SCAN`/`CONNECT`) **[LATER]** | On direct BLE CGM pairing | Pair via Health Connect or manual entry. |
| Camera **[LATER]** | If/when scanning a meal or device QR | Manual selection only. |

---

## 3. Information architecture & navigation map

### 3.1 Navigation model

The app uses a **persistent bottom-tab bar** as its primary navigation (`App.tsx`, `createBottomTabNavigator`). Tabs are headerless; each screen owns its scroll view and title. The four current tabs:

| Tab | Icon **[NOW]** | Screen | Purpose |
|-----|------|--------|---------|
| Home | 🩺 | `HomeScreen` | Dashboard: level, streak, organ health, live markers, disclaimer. |
| Log | ➕ | `LogScreen` | Core mechanic: log a choice and see the ripple. |
| Learn | 📚 | `LearnScreen` | Micro-lesson quests with a closing quiz. |
| Profile | 🏅 | `ProfileScreen` | Badges, level summary, reset. |

> Emoji icons are a prototype placeholder; Volume 7 replaces them with Material Symbols.

### 3.2 Planned navigation map

```
App root (NavigationContainer)
│
├─ [NEXT] First-run stack (shown until onboarding complete)
│   ├─ Welcome / value prop
│   ├─ Educational-use & data consent (HIPAA/GDPR)  ──► writes consent record
│   ├─ Personalization (condition type, meds, language, food/culture)
│   └─ Optional: connect data (Health Connect / CGM) · enable reminders
│
├─ Main tabs (after onboarding)
│   ├─ Home  ──► [NEXT] tap organ ► Organ detail (history, what drives it)
│   ├─ Log
│   ├─ Learn ──► Lesson flow (cards → quiz → result)  [NOW, nested in-screen]
│   ├─ [NEXT] Coach (AI Coach chat tab)
│   └─ Profile
│       └─ [NEXT] Settings (modal/stack)
│           ├─ Account & sync        [NEXT]
│           ├─ Reminders & medications [NEXT]
│           ├─ Connected devices / Health Connect (Device pairing) [NEXT]
│           ├─ Notifications channels  [NEXT]
│           ├─ Language & accessibility [NEXT]
│           ├─ Privacy & consent (view/withdraw) [NEXT]
│           └─ About / disclaimer / data export & delete [NEXT]
│
└─ Global overlays
    ├─ Loading splash ("Loading your journey…")  [NOW]
    ├─ Reward toast / badge-unlock feedback        [NOW, inline in Log/Learn]
    └─ Out-of-range alert sheet                    [NEXT]
```

### 3.3 Tab-count guidance

Five tabs (adding Coach) is the maximum for Material 3 bottom navigation. If a sixth destination is ever needed, Coach and Learn merge under a "Learn" hub, or Coach surfaces as a Home FAB — decision deferred to Volume 7.

---

## 4. Screen-by-screen specification

Each screen below lists: **Purpose · Layout · Key components · States · Validations · Primary flows · Data read/written**. The four existing screens are grounded in the real code; planned screens are marked **[NEXT]**/**[LATER]**.

### 4.0 App shell & loading gate **[NOW]**

- **Purpose:** Provide shared state and gate the UI until persisted state loads.
- **Layout:** `SafeAreaProvider` → `GameProvider` → `NavigationContainer` → `Tabs`.
- **States:** While `useGame().ready === false`, a centered `ActivityIndicator` with "Loading your journey…" is shown instead of tabs (`App.tsx`). Once `ready`, tabs render.
- **Data:** On mount, `GameProvider` reads `AsyncStorage["diabetes-quest/v1"]`; on any change it writes the full `PersistedState` back.

---

### 4.1 Onboarding & consent **[NEXT]**

- **Purpose:** Convert a first-time installer into an informed, consented, personalized user before the main app appears. Captures the legally required educational-use disclaimer and data-processing consent, plus the personalization the literature shows drives retention (condition type, meds, language, food/culture).
- **Layout:** Full-screen paged flow (no tab bar). Progress indicator at top; primary CTA pinned at bottom. Steps: Welcome → Consent → Personalization → Optional connect/reminders → Done.
- **Key components:** Value-prop carousel; consent screen with explicit, separately-toggled checkboxes (educational-use acknowledgement; data-processing consent; optional analytics consent); condition-type selector (Type 1 / Type 2 / prediabetes / caregiver); medication multi-select seeded from the drug actions (`metformin`, `bp-med`, `statin`); language picker; food/culture preference.
- **States:**
  - *Loading:* none required (static content) until the consent write.
  - *Empty:* first step is the default.
  - *Error:* if the consent record fails to persist, block "Continue", show retry; never advance silently.
  - *Success:* on completion, `onboardingComplete=true` is persisted and the app routes to Main tabs.
- **Validations:** Cannot proceed past Consent unless the educational-use acknowledgement **and** data-processing consent are checked. Analytics consent is optional and defaults **off** (GDPR opt-in). At least condition type must be chosen; meds/language/food are skippable with sensible defaults (Type 2, device locale).
- **Primary flows:** Install → Welcome → consent (mandatory toggles) → personalization → optional "Connect your data" (routes to Device pairing) and "Turn on reminders" (routes to notification permission) → land on Home.
- **Data read/written:** Writes a `ConsentRecord` (versioned text id, timestamp, granted scopes) and a `UserProfile` (condition, meds, locale, foodCulture). These seed reminder defaults and lesson localization. Consent text version is stored so re-consent can be forced when terms change.

---

### 4.2 Home dashboard **[NOW]**

- **Purpose:** Answer "How is my body today, and am I making progress?" at a glance. It is the emotional payoff of the organ-impact differentiator.
- **Layout (`HomeScreen.tsx`):** Vertical `ScrollView`:
  1. Title "Your body today" + subtitle "Day {body.day} of your journey".
  2. **Stats card** — three stats (`Lv {level}` + `{xp} XP`; `🔥 {streak}` day streak; `{inRangeCount}/{markerCount}` in range) over an XP `ProgressBar` and an "X XP to level N+1" hint.
  3. **Organs** section — one `OrganCard` per organ (heart, kidneys): emoji, label, rounded score, status `Pill` (Thriving/Healthy/Strained/At risk/Critical), a colored health `ProgressBar`, and an educational blurb.
  4. **Live markers** section — `Card` of `MarkerRow`s (glucose, systolic, hydration, LDL): label, target band, current value+unit, and a status `Pill` (In range / Borderline / Out of range).
  5. **Disclaimer** — "⚕️ This is an educational simulation, not medical advice…".
- **Key components:** `OrganCard`, `MarkerRow`, `Card`, `ProgressBar`, `Pill`.
- **States:** *Loading* handled by the app shell gate. *Empty/first-run:* shows initial body (`organs: heart 70, kidney 70`, day 0, markers at baseline) — a valid, non-empty state by design. No error state (pure read of in-memory context). **[NEXT]** add a per-organ *trend* sparkline and tappable Organ detail.
- **Validations:** none (read-only).
- **Primary flows:** Passive review; **[NEXT]** tap an organ → Organ detail explaining which markers and logged actions drove the current score.
- **Data read/written:** Reads `body` (markers, organs, day), `progress` (xp, streak), `level`, `inRangeCount` from `GameContext`. Writes nothing.

---

### 4.3 Log action **[NOW]**

- **Purpose:** The core mechanic. The patient logs a real-life choice; the app applies immediate marker effects, advances one simulated day, scores the organs, and shows the cause-and-effect ripple plus XP/badges.
- **Layout (`LogScreen.tsx`):** Title "Log a choice" + subtitle. Below it, a sticky-feeling **FeedbackCard** appears after the most recent log. Then three category groups (Diet 🍽️, Exercise 🏃, Medication 💊), each a wrap grid of tap tiles (emoji + label) sourced from `ACTIONS_BY_CATEGORY`.
- **Key components:** Action `Pressable` tiles (with press-scale animation); `FeedbackCard` showing the action's `teach` line, per-organ delta chips (e.g. "❤️ +1.5", "🫘 −2.3", hidden when delta is 0), an XP chip, and any badge-unlock lines.
- **States:**
  - *Empty:* no `feedback` yet → only the grids show.
  - *Success:* after a tap, `FeedbackCard` renders with the mechanism, deltas, XP, and any newly earned badges.
  - *Loading/error:* none today (synchronous in-memory). **[NEXT]** when logs sync to backend, the tile shows an optimistic state and a quiet "saved/queued" indicator; failures queue offline (never block the UI).
- **Validations:** Each tap is a valid log; `logAction` is idempotent per render. **[NEXT]** medication actions may prompt "Log against which scheduled dose?" when a reminder is pending.
- **Primary flows:** See [§5.1](#51-log-an-action-and-see-the-organ-ripple).
- **Data read/written:** Calls `logAction(action)` on `GameContext`, which:
  - applies `action.effects` to markers (`applyActionEffects`),
  - calls `advanceDay` (heals/damages organs, resets markers to baseline, increments `day`),
  - awards `XP.logAction` (+`XP.dailyAllMarkersInRange` bonus if every marker ended in range),
  - updates streak via `registerActivity`,
  - reconciles badges,
  - persists the new `body`+`progress` to AsyncStorage.
  Returns `{ organDelta, newBadges, xpGained }` for the FeedbackCard.

---

### 4.4 Learn — lessons + quiz **[NOW]**

- **Purpose:** Deliver evidence-based, bite-size patient education as gamified "quests", reinforcing the simulation's lessons with a check-question.
- **Layout (`LearnScreen.tsx`):** *List view* — title, subtitle, "X/Y lessons complete" with a `ProgressBar`, then a tappable `Card` row per lesson (emoji, title, summary, ✅/▶️ status). Selecting one swaps to the *Lesson flow*: a back link, lesson title, a step `ProgressBar`, then card screens (title/body + "Next") and finally the quiz (prompt + option `Pressable`s). On answer, options reveal correct/wrong styling and a result block (explanation, "+XP earned", badge lines, "Finish").
- **Key components:** `Card`, `ProgressBar`, `Button`, quiz option pressables with `optionCorrect`/`optionWrong` styles.
- **States:**
  - *Empty:* none — `LESSONS` is bundled content, always present.
  - *In-progress:* `step` tracks 0..cards (quiz is the last step).
  - *Answered:* `picked !== null` locks further answers and reveals the result.
  - *Completed:* lesson id is in `completedLessons`; XP is awarded **once** (repeat completions grant 0 XP).
- **Validations:** Only the first answer per quiz counts (`if (picked !== null) return`). Re-entering a completed lesson is allowed for review but does not re-award XP.
- **Primary flows:** See [§5.2](#52-complete-a-lesson).
- **Data read/written:** Reads `completedLessons` and bundled `LESSONS`. Calls `completeLesson(lessonId, passedQuiz)`, which awards `XP.completeLesson` (+`XP.passQuiz` if correct) the first time, reconciles the `scholar` badge (3 lessons), and persists.

---

### 4.5 Profile & badges **[NOW]**

- **Purpose:** Make competence and progress legible (level, totals) and showcase earned/locked badges; provide a reset for testing/clean-start.
- **Layout (`ProfileScreen.tsx`):** Title "Your progress"; a summary `Card` (Level N, XP `ProgressBar`, and four summary stats: total XP, streak, lessons, badges); a "Badges" section as a two-column grid where earned badges show their emoji+label+description and locked badges show 🔒 dimmed; a ghost "Reset progress" button gated behind a confirm `Alert`.
- **Key components:** `Card`, `ProgressBar`, `Button` (ghost), badge grid cards, `Summary`.
- **States:** *Empty:* with no progress, all badges render locked and stats read 0 — still a valid screen. *Confirm:* reset shows a destructive `Alert` ("Reset progress?"). *Success:* reset re-initializes body, progress, and lessons.
- **Validations:** Reset requires explicit confirmation. **[NEXT]** when an account exists, reset is scoped to local cache and must reconcile with the backend (see [§7.4](#74-migration-local--synced)).
- **Primary flows:** Review badges → optionally reset (confirm → cleared). **[NEXT]** edit profile, manage account, open Settings.
- **Data read/written:** Reads `progress`, `level`, `completedLessons`, and `BADGES`. `reset()` writes initial state to context and AsyncStorage.

---

### 4.6 Settings **[NEXT]**

- **Purpose:** Central control for account/sync, reminders & medications, connected devices, notification channels, language/accessibility, privacy/consent, and data export/delete.
- **Layout:** Grouped list (Material 3 list sections), reachable from Profile. Each row opens a sub-screen.
- **Key components:** List rows with leading icon, trailing control (switch/chevron/value); destructive actions (delete account, withdraw consent) styled and confirmed.
- **States:** *Loading* when fetching account/sync status; *error* with retry on backend calls; *success* via inline confirmation.
- **Validations:** Withdrawing data-processing consent triggers a clear consequence dialog (what stops working, what is deleted). Account deletion is double-confirmed and routes to a tombstoned local state.
- **Primary flows:** Toggle reminders → request `POST_NOTIFICATIONS`; manage meds & schedules; connect/disconnect devices; change language; export data (JSON/FHIR bundle) or request deletion.
- **Data read/written:** Reads/writes `UserProfile`, `ReminderConfig`, `ConsentRecord`, connected-device list, and notification-channel preferences. Export/delete coordinate with backend (Volume 4) and honor GDPR data-subject rights (Volume 8).

---

### 4.7 Device pairing (Health Connect / CGM) **[NEXT]**

- **Purpose:** Let the patient connect real activity and glucose data so the simulation reflects actual behaviour, raising fidelity and reducing self-report burden.
- **Layout:** A "Connected data" screen listing available sources: **Health Connect** (steps, activity, hydration, BP, glucose) and **CGM** (via Health Connect provider app, or **[LATER]** direct BLE). Each source row shows status (Not connected / Connected / Needs permission / Unavailable) and a primary action.
- **Key components:** Source cards with status pill; permission-rationale sheet; per-data-type granular toggles; a "What we read and why" expandable explainer.
- **States:**
  - *Unavailable:* device below Health Connect floor or no provider installed → CTA to install/learn more, source disabled.
  - *Needs permission:* show rationale → launch system permission sheet.
  - *Connected (partial):* some types granted; clearly indicate which are active.
  - *Error:* permission denied, provider error, or stale data → explain and offer manual logging fallback.
  - *Success:* connected; next sync surfaces imported activity as **confirmable suggestions**, not silent logs.
- **Validations:** App must operate with any subset of permissions. Glucose/BP read from devices are displayed as **observed values for context**, never relabeled as the simulation's marker, and never used to diagnose.
- **Primary flows:** See [§5.3](#53-pair-a-cgm--connect-health-connect).
- **Data read/written:** Requests Health Connect read scopes; reads recent records; writes `ExerciseSession`/`Hydration` back on opt-in. Persists a `DeviceConnection` list and last-sync timestamps. Imported observations are stored locally and (when synced) mapped to FHIR `Observation` by the backend (Volume 4/5).

---

### 4.8 AI Coach chat **[NEXT]**

- **Purpose:** A conversational layer that explains the patient's own data ("why did my kidneys drop today?"), encourages SDT-aligned next steps, and answers general diabetes-education questions — **without ever diagnosing, prescribing, or changing medication**.
- **Layout:** Chat tab: message list (assistant/user bubbles), a suggestion-chip row ("Explain my heart score", "What's one easy win today?"), and a text composer. A persistent header disclaimer: "Coach gives general education, not medical advice. For dosing or symptoms, contact your care team."
- **Key components:** Message bubbles, streaming indicator, suggestion chips, safety banner, "talk to your care team" escalation card, feedback (👍/👎) on responses.
- **States:**
  - *Empty:* greeting + suggestion chips.
  - *Loading:* streaming/typing indicator; composer disabled mid-send.
  - *Error:* network/model error → retry with preserved draft; offline → "Coach needs a connection" with cached tips fallback.
  - *Guardrail:* if the user asks for a diagnosis/dose, the Coach declines and redirects to the care team (behaviour owned by Volume 6).
- **Validations:** No PHI is sent beyond the agreed scope; messages are subject to the AI safety guardrails in Volume 6. The Coach must cite that it cannot prescribe when relevant.
- **Primary flows:** Ask a question or tap a chip → grounded, streamed answer referencing the patient's current organ/marker context → optional follow-up action (open Log, open a lesson).
- **Data read/written:** Reads a redacted snapshot of `body`/`progress` for grounding context (per consent). Sends/receives chat turns via backend AI service. Persists conversation history locally (and synced if consented). Writes telemetry on usage and guardrail triggers.

---

## 5. Core workflows

### 5.1 Log an action and see the organ ripple **[NOW]**

1. Patient opens the **Log** tab.
2. Patient taps an action tile (e.g. "🥤 Sugary drink").
3. `LogScreen.onLog` calls `GameContext.logAction(action)`.
4. Engine applies `effects` (`glucose +55`) to markers via `applyActionEffects`.
5. `advanceDay` scores each organ on the day just lived (heal +1.5 if all sensitive markers in range, else damage scaled by average deviation × 14), then resets markers to baseline and increments `day`.
6. XP is computed (`logAction` 10 XP, +30 if every marker ended in range); streak updates via `registerActivity` (forgiving: a one-day gap is forgiven with a grace day; a longer gap restarts at 1, never 0).
7. Badges are reconciled; any newly earned badge is returned.
8. New `body`+`progress` are set in context and persisted to AsyncStorage.
9. `FeedbackCard` renders: the `teach` mechanism line, per-organ delta chips, "+XP", and any "Badge unlocked".
10. Patient switches to **Home** and sees updated organ scores, markers, level, streak, and "in range" count.

### 5.2 Complete a lesson **[NOW]**

1. Patient opens **Learn** and taps a lesson card.
2. `LessonFlow` shows card 1; "Next" advances through all cards.
3. After the last card, the **quiz** step renders the prompt and options.
4. Patient selects an option; `onAnswer` locks the choice, reveals correct/wrong styling, and calls `completeLesson(lessonId, passed)`.
5. First completion awards `completeLesson` 40 XP (+25 if the answer was correct); repeat completions award 0.
6. Badges reconcile (e.g. `scholar` at 3 lessons); the result block shows explanation, XP, and any badge.
7. "Finish" returns to the lesson list, where the lesson now shows ✅ and the progress bar advances.

### 5.3 Pair a CGM / connect Health Connect **[NEXT]**

1. From Onboarding ("Connect your data") or Settings → Device pairing, patient opens **Connected data**.
2. Patient taps **Health Connect** → app shows a rationale sheet ("We read steps and activity to auto-suggest your exercise logs; you confirm everything").
3. App launches the Health Connect permission sheet; patient grants a subset of read scopes.
4. App reads recent records and shows imported items as **confirmable suggestions** in Log ("Looks like you walked 32 min — log it?").
5. For a **CGM**, patient connects the CGM's Health Connect provider (or **[LATER]** pairs over BLE); granted `BloodGlucose` reads appear as observed-glucose context on Home, clearly distinct from the teaching marker.
6. App records `DeviceConnection` + last-sync time; patient can revoke any scope in Settings or in Health Connect at any time.

### 5.4 Respond to a medication reminder **[NEXT]**

1. At a scheduled time, the app fires a local notification on the **medication** channel: "Time for your metformin."
2. Patient taps the notification → deep-links to **Log**, pre-focused on the relevant drug action, with a "Taken now" / "Snooze 15m" / "Skip" action set (also available as notification actions).
3. "Taken" logs the corresponding drug action (e.g. `metformin`, `glucose −30`), runs the standard log workflow ([§5.1](#51-log-an-action-and-see-the-organ-ripple)), and clears the reminder for that slot.
4. "Skip" optionally logs the `missed-meds` action (teaching the rebound effect) and schedules an adherence-aware nudge.
5. Adherence outcome feeds streak/badges and (when synced) the care-team view (Volume 3).

---

## 6. Functional requirements

Each requirement has a stable ID and acceptance criteria (AC). Maturity tags follow [§1.4](#14-capability-maturity-legend).

### 6.1 Core simulation & logging

**FR-AND-001 — Log an action [NOW]**
The app shall let the patient log any catalog action and immediately apply its marker effects.
- AC1: Tapping a tile invokes `logAction` exactly once and updates markers per `action.effects`.
- AC2: Markers stay within their `clamp` bounds.
- AC3: A FeedbackCard with the `teach` line appears within 100 ms of the tap.

**FR-AND-002 — Day advance & organ scoring [NOW]**
Logging shall advance one simulated day and update organ health.
- AC1: Each organ heals (+1.5) when all its sensitive markers are in range, else loses `avgDeviation × 14`.
- AC2: Organ health stays within `[0, 100]`.
- AC3: `day` increments by exactly 1 per log; markers reset to baseline for the next day.

**FR-AND-003 — Per-organ ripple feedback [NOW]**
The app shall show the per-organ delta and XP for the logged action.
- AC1: Non-zero organ deltas render as colored chips (green gain / red loss); zero deltas are hidden.
- AC2: XP gained is shown; "all markers in range" awards the +30 bonus.

**FR-AND-004 — Organ-impact dashboard [NOW]**
Home shall present current organ health, markers, level, streak, and in-range count.
- AC1: Organ status label/color matches `organStatus` thresholds.
- AC2: Marker status matches `markerStatus` (In range / Borderline / Out of range).
- AC3: The educational disclaimer is always visible on Home.

### 6.2 Education

**FR-AND-010 — Micro-lesson quests [NOW]**
The app shall deliver card-based lessons ending in a single quiz.
- AC1: Lesson progress bar reflects `(step+1)/total`.
- AC2: First completion awards 40 XP, +25 if the quiz answer is correct.
- AC3: Repeat completion awards 0 XP and does not duplicate the lesson in `completedLessons`.

**FR-AND-011 — Quiz integrity [NOW]**
Only the first quiz answer shall be scored.
- AC1: After the first tap, further taps are ignored and correct/wrong styling is revealed.
- AC2: The explanation text is shown regardless of correctness.

### 6.3 Gamification

**FR-AND-020 — XP & levels [NOW]**
The app shall track XP and derive level via the quadratic curve.
- AC1: Level and "XP to next level" match `levelFromXp`/`xpForLevel`.
- AC2: XP never decreases.

**FR-AND-021 — Forgiving streak [NOW]**
The streak shall be forgiving per SDT.
- AC1: Same-day re-logging does not double-count.
- AC2: A one-day gap with a grace day available keeps the streak; the grace day is consumed.
- AC3: A break restarts the streak at 1, never 0.

**FR-AND-022 — Badges [NOW]**
The app shall unlock badges when conditions are met and surface them.
- AC1: Newly earned badges return from `logAction`/`completeLesson` and display once.
- AC2: Profile shows earned badges and locked placeholders.

### 6.4 Onboarding, consent & profile

**FR-AND-030 — Consent gate [NEXT]**
The app shall block main features until educational-use acknowledgement and data-processing consent are recorded.
- AC1: "Continue" is disabled until both mandatory toggles are on.
- AC2: A versioned `ConsentRecord` (id, timestamp, scopes) is persisted before entering the app.
- AC3: Analytics consent defaults off and is independently toggleable.

**FR-AND-031 — Personalization [NEXT]**
The app shall capture condition type, medications, language, and food/culture.
- AC1: Selected meds pre-populate medication reminders and relevant Log tiles.
- AC2: Language choice localizes UI and lesson content where translations exist.

**FR-AND-032 — Re-consent on terms change [NEXT]**
The app shall force re-consent when the stored consent version is older than the current required version.
- AC1: On version mismatch, the consent screen is shown before further use.

### 6.5 Devices & data

**FR-AND-040 — Health Connect opt-in [NEXT]**
The app shall request Health Connect reads only after explicit opt-in and function with any subset granted.
- AC1: No health permission is requested before the user taps "Connect".
- AC2: With zero health permissions, manual logging, lessons, and simulation work fully.

**FR-AND-041 — Device data as confirmable suggestions [NEXT]**
Imported activity shall be presented for confirmation, not silently scored.
- AC1: An imported walk appears as a suggested log the user can accept or dismiss.
- AC2: Device-sourced glucose/BP are shown as observed context, visually distinct from the teaching markers, and never labeled as diagnosis.

### 6.6 Reminders & notifications

**FR-AND-050 — Medication reminders [NEXT]**
The app shall fire local medication reminders on schedule with Taken/Snooze/Skip actions.
- AC1: Tapping the notification deep-links to Log focused on the right action.
- AC2: "Taken" runs the standard log workflow and clears that slot.

**FR-AND-051 — Streak nudge [NEXT]**
The app shall send at most one streak-protection nudge per day, only when a grace day is at risk, and never shaming.
- AC1: No nudge is sent if the user already logged today.
- AC2: Copy is encouraging ("Keep your streak — one quick log") and respects quiet hours.

**FR-AND-052 — Out-of-range alert [NEXT]**
The app shall surface an informational (non-alarming, non-diagnostic) alert when device-observed values are persistently out of range, advising the patient to consult their care team.
- AC1: The alert never states a diagnosis or recommends a dose.
- AC2: The alert includes a "contact your care team" affordance and can be muted.

### 6.7 AI Coach

**FR-AND-060 — AI Coach chat [NEXT]**
The app shall provide a conversational coach grounded in the patient's current context.
- AC1: Responses stream and reference the user's current organ/marker state when relevant.
- AC2: The Coach declines diagnosis/prescription requests and redirects to the care team.
- AC3: A persistent disclaimer is visible in the chat.

### 6.8 Persistence, sync & lifecycle

**FR-AND-070 — Local persistence [NOW]**
The app shall persist body, progress, and completed lessons across restarts.
- AC1: State written to `diabetes-quest/v1` is restored on next launch.
- AC2: Corrupt/missing storage starts a clean valid state without crashing.

**FR-AND-071 — Reset [NOW]**
The app shall let the patient reset all local progress behind a confirmation.
- AC1: Reset requires an explicit destructive confirm.
- AC2: After reset, body/progress/lessons return to initial values.

**FR-AND-072 — Backend sync [NEXT]**
The app shall sync local state to the backend when an account exists and connectivity allows.
- AC1: Local-only users are migrated without data loss on account creation ([§7.4](#74-migration-local--synced)).
- AC2: Offline changes queue and sync on reconnect; conflicts resolve last-write-wins per record with server authority on identity.

**FR-AND-073 — Data export & deletion [NEXT]**
The app shall let the patient export their data and request deletion (GDPR rights).
- AC1: Export produces a portable bundle (JSON; FHIR R4 where applicable).
- AC2: Deletion removes local data and triggers backend deletion.

---

## 7. Data model & persistence

### 7.1 Persisted shape (current) **[NOW]**

`GameContext` persists one JSON object under `AsyncStorage["diabetes-quest/v1"]`:

```ts
interface PersistedState {
  body: BodyState;             // simulated body
  progress: ProgressState;     // gamification
  completedLessons: string[];  // lesson ids
}
```

**`BodyState`** (`physiology.ts`):

```ts
interface BodyState {
  markers: Record<MarkerKey, number>;   // glucose | systolic | hydration | ldl
  organs:  Record<OrganKey, number>;    // heart | kidney, 0..100
  day:     number;                      // day index since start
}
```

**`ProgressState`** (`gamification.ts`):

```ts
interface ProgressState {
  xp: number;
  streak: number;        // consecutive days with ≥1 log
  graceDays: number;     // forgiveness buffer
  badges: string[];      // earned badge ids
  lastActiveDay: number; // day index of last activity
}
```

Reference constants: `MARKERS` (healthy band, clamp, baseline per marker), `ORGANS` (sensitivity weights), `BADGES`, and `XP` awards (`logAction 10`, `completeLesson 40`, `passQuiz 25`, `dailyAllMarkersInRange 30`).

### 7.2 Write semantics **[NOW]**

- The provider writes the **entire** `PersistedState` on any change after initial load (debounce-free, fire-and-forget; failures are swallowed today and must become observable telemetry — see [§12](#12-analytics--telemetry)).
- Read happens once on mount, gated by `ready`.

### 7.3 Planned schema additions **[NEXT]**

| Entity | Purpose | Key fields |
|--------|---------|-----------|
| `UserProfile` | Personalization | condition, medications[], locale, foodCulture |
| `ConsentRecord` | Legal consent | consentVersion, timestamp, scopes[] (educational, data, analytics) |
| `ReminderConfig` | Reminders | per-medication schedule, quiet hours, channels |
| `DeviceConnection` | Pairing | source (HealthConnect/CGM), grantedTypes[], lastSync |
| `Observation` (imported) | Device data | type, value, unit, time, source (kept distinct from teaching markers) |
| `SyncMeta` | Sync | schemaVersion, lastSyncedAt, dirty flags, deviceId |

A **`schemaVersion`** field shall be added to the persisted root to support forward migrations. On load, an unknown/older version runs a migration chain; an unmigratable payload falls back to a clean state without crashing (extends FR-AND-070).

### 7.4 Migration: local → synced **[NEXT]**

1. **Today:** all state is local; no PII leaves the device.
2. **Account creation (OAuth2/OIDC):** on first sign-in, the local `PersistedState` is uploaded as the seed of the server record; the local store keeps a cache plus `SyncMeta`.
3. **Ongoing sync:** writes go to the local cache immediately (offline-first) and queue for the backend; on reconnect the queue flushes. Per-record last-write-wins, with the server authoritative for identity/consent.
4. **Multi-device:** server record is the source of truth; a new device hydrates from server, then merges any local-only progress.
5. **Reset/delete:** local reset clears the cache; account deletion ([§4.6](#46-settings-next)) tombstones local state and triggers backend deletion.

Backend contract, conflict rules, and FHIR mapping are specified in **Volume 4**; device-observation normalization in **Volume 5**.

---

## 8. Notifications & reminders

### 8.1 Channels (Android 8+ notification channels) **[NEXT]**

| Channel | Importance | Examples |
|---------|-----------|----------|
| Medication | High | "Time for your metformin" with Taken/Snooze/Skip. |
| Streak & motivation | Default/Low | At-risk streak nudge; "+ a quick win today". |
| Health alerts | High | Out-of-range observed-value advisory (non-diagnostic). |
| Coach | Low | Optional coach follow-ups (opt-in). |

Each channel is independently mutable in Settings and the system settings. `POST_NOTIFICATIONS` (Android 13+) is requested the first time any channel is enabled.

### 8.2 Rules

- **Medication (FR-AND-050):** fire at each scheduled slot; expose Taken/Snooze(15m)/Skip; "Taken" logs the drug action; "Skip" may log `missed-meds`. Suppress if already logged for that slot.
- **Streak nudge (FR-AND-051):** at most one per day; only when no activity yet and a grace day is at risk; encouraging, never shaming; respect quiet hours (default 22:00–08:00).
- **Out-of-range alert (FR-AND-052):** only from device-observed data, only on a persistent pattern, informational and non-diagnostic, always pointing to the care team; mutable/mutable-per-type.
- **Frequency cap:** non-medication notifications capped (default 2/day) to avoid fatigue.
- **Localization & accessibility:** all copy localized; respects system Do-Not-Disturb.

---

## 9. Offline behaviour & sync

- **Offline-first by construction (current).** The entire current app runs offline: simulation, logging, lessons, gamification, and persistence are local. Connectivity is not required for the core loop.
- **Local reads/writes are synchronous** against in-memory context, persisted to AsyncStorage; the user never waits on a network for the core loop.
- **Graceful degradation:** with no Health Connect/CGM and no network, manual logging + lessons + simulation remain fully functional (extends FR-AND-040).
- **Sync queue [NEXT]:** mutations made offline are recorded with `SyncMeta` dirty flags and a monotonic local clock; on reconnect they flush in order. The UI shows a quiet sync status (synced / queued / error) and never blocks logging on sync.
- **Conflict resolution [NEXT]:** per-record last-write-wins with server authority for identity/consent; detailed rules in Volume 4.
- **AI Coach offline [NEXT]:** Coach requires connectivity; offline it shows cached tips and a "needs connection" state rather than failing hard.

---

## 10. Error states & edge cases

| ID | Scenario | Expected behaviour |
|----|----------|--------------------|
| EC-01 | AsyncStorage read returns corrupt JSON **[NOW]** | Catch, start clean valid state, set `ready`; no crash (current `try/catch`). Add telemetry. |
| EC-02 | AsyncStorage write fails **[NOW]** | Currently swallowed; **[NEXT]** surface a non-blocking "couldn't save" indicator and retry; never lose the in-memory state mid-session. |
| EC-03 | Rapid repeated log taps **[NOW]** | Each tap is a discrete valid log; markers clamp; UI stays responsive. |
| EC-04 | Same-day multiple logs **[NOW]** | `registerActivity` does not double-count the streak; XP still accrues per log. |
| EC-05 | Large day gap between sessions **[NOW]** | Streak restarts at 1 (never 0); no negative or NaN values. |
| EC-06 | Schema/version mismatch on load **[NEXT]** | Run migration chain; if unmigratable, fall back to clean state, notify, and offer export of raw blob first. |
| EC-07 | Notification permission denied **[NEXT]** | Disable reminders gracefully; offer in-app nudges; show how to enable in system settings. |
| EC-08 | Health Connect unavailable / no provider **[NEXT]** | Mark source unavailable; keep manual logging; link to install/learn-more. |
| EC-09 | Partial Health Connect grant **[NEXT]** | Use granted types; clearly indicate which are active; never block on missing scopes. |
| EC-10 | Device clock changed / timezone shift **[NEXT]** | Day-index logic tolerant to clock skew; prefer server time when synced; avoid double day-advance. |
| EC-11 | AI Coach asks for diagnosis/dose **[NEXT]** | Decline, explain limits, redirect to care team (Volume 6 guardrail). |
| EC-12 | Network loss mid-sync **[NEXT]** | Queue remains; retry with backoff; no duplicate records (idempotency keys). |
| EC-13 | Account on a new device **[NEXT]** | Hydrate from server, then merge local-only progress; no silent overwrite of unsynced local gains. |
| EC-14 | Reset while syncing **[NEXT]** | Confirm twice; clear local cache and reconcile deletion with backend. |

---

## 11. Accessibility & localization

> Visual design-system detail (contrast tokens, type scale, component specs) is deferred to **Volume 7**. This section states app-level requirements.

### 11.1 Accessibility

- **Screen reader:** all interactive elements (action tiles, quiz options, badges, nav tabs) have meaningful `accessibilityLabel`/`accessibilityRole`; feedback (organ deltas, XP, badge unlocks) is announced via `accessibilityLiveRegion`/`AccessibilityInfo` so non-visual users perceive the ripple. (Current emoji-only labels must be supplemented with text labels.)
- **Color independence:** marker/organ status must not rely on color alone — pair with the status text already present (`In range`, `Strained`, etc.). Meets WCAG 2.1 AA intent.
- **Dynamic type / large text:** layouts must reflow with the system font scale; no clipped text or fixed-height traps.
- **Touch targets:** ≥ 48 dp; action tiles and quiz options comply.
- **Motion:** respect "reduce motion"; the press-scale and any future ripple animation degrade to non-animated state changes.
- **Focus order:** logical traversal on each screen; modals (Settings, consent) trap focus appropriately.

### 11.2 Localization

- **Language:** all UI strings, lesson content (`lessons.ts`), action labels/`teach` lines, and notification copy are externalized for translation. Language is chosen at onboarding and changeable in Settings; default to device locale.
- **Food/culture:** the action catalog and examples adapt to the patient's food culture (literature shows this drives engagement). The catalog must be data-driven so localized variants can be supplied without code changes.
- **Units & formats:** glucose unit (mg/dL vs mmol/L), date/number formatting, and RTL layout support follow locale. (Current marker units are mg/dL/% — a unit-preference layer is **[NEXT]**.)
- **No hard-coded strings** in screens; all user-facing text routes through the i18n layer.

---

## 12. Analytics & telemetry

Telemetry is **opt-in** (consent default off, [§6.4](#64-onboarding-consent--profile)), privacy-preserving, and must contain **no PHI**. Events instrument the core loop and funnels.

| Event | When | Key properties |
|-------|------|----------------|
| `app_open` | Cold/warm start | source, cold_start_ms |
| `onboarding_step_view` / `onboarding_complete` **[NEXT]** | Onboarding | step, dropped |
| `consent_set` **[NEXT]** | Consent recorded | version, scopes |
| `action_logged` | Each log | category, action_id, all_in_range, xp_gained |
| `organ_delta_shown` | Feedback render | organ, delta_sign |
| `lesson_started` / `lesson_completed` | Learn | lesson_id, passed_quiz, first_time |
| `badge_unlocked` | Badge earned | badge_id |
| `streak_advanced` / `streak_reset` | Streak change | streak_value, grace_used |
| `level_up` | Level change | new_level |
| `reminder_fired` / `reminder_actioned` **[NEXT]** | Reminders | channel, action (taken/snooze/skip) |
| `device_connect` / `device_sync` **[NEXT]** | Pairing | source, granted_types, item_count |
| `coach_message` / `coach_guardrail` **[NEXT]** | AI Coach | length_bucket, guardrail_type |
| `sync_flush` / `sync_error` **[NEXT]** | Sync | queued_count, error_code |
| `persist_error` **[NEXT]** | AsyncStorage write fails | error_code (closes EC-02 visibility) |
| `crash` / `anr` | Stability | screen, fingerprint |

Retention funnels of interest: install → consent → first log → day-3 streak → first lesson → day-7 retention.

---

## 13. Non-functional requirements

Targets are for the patient app on a representative mid-range Android device (e.g. ~4 GB RAM, Android 12+), measured in release builds.

| ID | Attribute | Target |
|----|-----------|--------|
| NFR-AND-01 | **Cold start** | ≤ 2.5 s to interactive on mid-range; ≤ 1.5 s warm. Loading gate shows the spinner only until persisted state hydrates. |
| NFR-AND-02 | **Frame rate** | Smooth scroll and log feedback at 60 fps; no dropped-frame jank > 16 ms on the core loop; ripple animations respect reduce-motion. |
| NFR-AND-03 | **Log responsiveness** | FeedbackCard renders ≤ 100 ms after a tap (synchronous engine). |
| NFR-AND-04 | **Battery** | Negligible background drain; reminders use OS scheduling (no wakelocks/polling); Health Connect sync batched and opportunistic. |
| NFR-AND-05 | **Crash-free rate** | ≥ 99.5% crash-free sessions; ≥ 99.0% ANR-free. |
| NFR-AND-06 | **App size** | Release APK/AAB ≤ ~40 MB base download. |
| NFR-AND-07 | **Memory** | No leaks across navigation; steady-state working set within mid-range budget; no growth from repeated logging. |
| NFR-AND-08 | **Offline** | 100% of the core loop (log, simulate, learn, persist) works with no network (extends [§9](#9-offline-behaviour--sync)). |
| NFR-AND-09 | **Data safety** | No PHI leaves the device without consent; at-rest data follows the security controls in Volume 8 (encryption, OWASP MASVS). |
| NFR-AND-10 | **Accessibility conformance** | Meets WCAG 2.1 AA intent for mobile (targets, contrast, screen-reader, dynamic type). |
| NFR-AND-11 | **Localization readiness** | Zero hard-coded user-facing strings; supports RTL and locale unit formats. |
| NFR-AND-12 | **Startup correctness** | Corrupt/missing storage never blocks startup (extends FR-AND-070). |

---

## 14. Traceability & cross-references

This volume depends on and feeds the rest of the suite:

- **[01-product-vision.md](./01-product-vision.md)** — vision, personas, MDA core loop, SDT rationale, and the organ-impact differentiator this PRD realizes.
- **[03-doctor-panel.md](./03-doctor-panel.md)** — the clinician view consuming patient adherence, logs, and (synced) observations; medication-reminder outcomes flow here.
- **[04-backend.md](./04-backend.md)** — sync protocol, conflict rules, OAuth2/OIDC identity, FHIR R4 mapping, data export/deletion services referenced in [§7](#7-data-model--persistence) and [§9](#9-offline-behaviour--sync).
- **[05-medical-devices.md](./05-medical-devices.md)** — Health Connect/CGM integration internals, observation normalization, and pairing details behind [§4.7](#47-device-pairing-health-connect--cgm-next).
- **[06-ai-system.md](./06-ai-system.md)** — AI Coach model, grounding, and the never-diagnose/prescribe guardrails behind [§4.8](#48-ai-coach-chat-next) and FR-AND-060.
- **[07-uiux-design-system.md](./07-uiux-design-system.md)** — Material Design 3 tokens, component anatomy, iconography, and motion that replace prototype placeholders referenced throughout [§4](#4-screen-by-screen-specification) and [§11](#11-accessibility--localization).
- **[08-security-compliance.md](./08-security-compliance.md)** — HIPAA/GDPR/ISO 27001, OWASP MASVS, consent, and data-subject rights underpinning [§6.4](#64-onboarding-consent--profile), [§7.4](#74-migration-local--synced), and NFR-AND-09.
- **[09-qa-testing.md](./09-qa-testing.md)** — test strategy and acceptance suites that verify the `FR-AND-###` requirements and NFRs in this volume.
- **[10-claude-code-build-playbook.md](./10-claude-code-build-playbook.md)** — the build/automation playbook for implementing these requirements with Claude Code.

---

_End of Volume 2 — Android Application PRD._
