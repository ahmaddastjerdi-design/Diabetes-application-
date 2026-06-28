# Device QA Checklist — Diabetes Quest

A systematic pass for verifying the app on a real Android device/emulator — the
things `tsc`, Jest, and the Metro bundle **can't** confirm (animations, SVG
layout, touch behavior, haptics, native permission flows, persistence).

Tick each item; for anything that fails, note the screen + what you saw and hand
it back. A **report template** is at the bottom.

---

## 0. Setup

| | Step |
|---|---|
| ☐ | `npm install` |
| ☐ | **Expo Go path** (most features): `npm run android` → open in Expo Go. Health Connect + notification *scheduling* will be limited here. |
| ☐ | **Dev-build path** (everything): `npx expo run:android` to get a dev client with the native modules. |
| ☐ | Install/enable **Health Connect** on the device (built into Android 14+, else Play Store) if testing steps. |

> Two features need the **dev build**: Health Connect step sync and reliable
> medication-reminder scheduling. Everything else works in Expo Go.

---

## 1. Onboarding (first launch / after "Reset" + reopen)

| | Check | Expected |
|---|---|---|
| ☐ | App opens to onboarding (not tabs) on first run | Gradient "🩺 Diabetes Quest" + a step card |
| ☐ | Step indicator (progress bar) advances per step | Bar fills left→right across 5 steps |
| ☐ | Name step: "Continue" disabled until you type a name | Button greyed until ≥1 char |
| ☐ | Each step card **fades/slides in** when you advance | Subtle entrance animation (unless reduce-motion on) |
| ☐ | Condition: selecting one highlights it (blue) | Radio shows 🔘, others ⚪ |
| ☐ | Medications: multi-select toggles (☑️/⬜) | Multiple can be on at once |
| ☐ | Step goal: one chip selected (blue fill) | Only one active |
| ☐ | Connect step: if you picked meds, a **"🔔 Daily medication reminder"** opt-in appears | Tapping toggles ☑️/⬜ |
| ☐ | Finish button reads "Start, &lt;name&gt;!" | Tapping → permission prompt (if reminder on) → tabs |
| ☐ | Haptic on each tap (selection / continue) | Light tactile bump |

---

## 2. First-session tutorial (immediately after onboarding)

| | Check | Expected |
|---|---|---|
| ☐ | A 4-card "how it works" overlay appears over the tabs | 👋 → ➕ → ❤️ → 🏅 |
| ☐ | Progress dots; active dot is wider/blue | Advances with "Next" |
| ☐ | "Skip" dismisses immediately | Returns to Home |
| ☐ | Last card button reads "Let's go!" | Dismisses, celebratory haptic |
| ☐ | Does **not** reappear on next app open | Shown once |
| ☐ | Profile → "Replay walkthrough" shows it again | Overlay returns |

---

## 3. Home (dashboard)

| | Check | Expected |
|---|---|---|
| ☐ | Content starts **below** the status bar/notch | Safe-area respected (no clipping) |
| ☐ | Gradient hero greets "Hi &lt;name&gt; 👋" + condition + Day N | Personalized |
| ☐ | Level / 🔥 streak / in-range stats render | "in range" counts up on mount |
| ☐ | XP bar animates its fill | Smooth, not instant |
| ☐ | **Today's goals** card: 3 goals with ⬜/✅ + XP values | "0/3" initially |
| ☐ | **Body diagram**: silhouette with heart + kidneys tinted by health | Heart has a gentle **pulsing** halo |
| ☐ | **Long-term control** (eA1c) card shows a % + status pill | e.g. "On target" (hidden if <1 day history) |
| ☐ | **Weekly recap** card | Hidden until ≥3 days of history, then shows ▲/▼ deltas |
| ☐ | **Activity** card | See §8 (Health Connect) |
| ☐ | Organ cards below show score (animated count) + "Tap for trend & tips ›" | |
| ☐ | Live markers list: glucose **out of range** (red), others in range (green) at start | Glucose is the lever |
| ☐ | Educational disclaimer at the bottom | Present |

---

## 4. Log (core mechanic) — the most important screen

| | Check | Expected |
|---|---|---|
| ☐ | Three sections: Diet / Exercise / Medication | Tiles in a grid |
| ☐ | **Medication tiles match the meds you picked** at onboarding (+ "Missed my medicine") | Not the full list |
| ☐ | Tap **30-min walk** | Feedback card appears with a **success** haptic |
| ☐ | Feedback shows the teaching line + an **animated causal chain** | `🚶 30-min walk → Glucose ↓ Blood ↓ → ❤️ +.. 🫘 +..` fading in link by link |
| ☐ | A **+XP toast** slides down from the top | e.g. "+85 XP" |
| ☐ | First action ever → **badge celebration overlay** ("First Step") with emoji burst | Tap to dismiss |
| ☐ | Walk brings **all markers in range** → check Home: markers green, organs healed | Reward path works |
| ☐ | Tap **Sugary drink** | **Warning** haptic; chain shows red ↑ + organ minus; organs dip on Home |
| ☐ | Tap a **Balanced plate** alone | Glucose rises (teaches carbs raise sugar) — expected, not a bug |
| ☐ | Press-in on a tile scales it slightly | Tactile press feedback |
| ☐ | Logging repeatedly increments **Day N** on Home each time | One action = one day |

---

## 5. Learn (lessons)

| | Check | Expected |
|---|---|---|
| ☐ | 4 lessons listed; completed ones show ✅ | |
| ☐ | Open a lesson → cards advance with "Next" | Progress bar per card |
| ☐ | Quiz: correct answer turns green, wrong turns red | Success/warning haptic |
| ☐ | Finishing awards XP toast + (first 3 lessons) Scholar achievement celebration | |
| ☐ | "Finish a lesson" daily goal ticks on Home | ✅ |
| ☐ | Re-opening a finished lesson awards no extra XP | Idempotent |
| ☐ | "‹ All lessons" back link works | |

---

## 6. Profile

| | Check | Expected |
|---|---|---|
| ☐ | Header "&lt;name&gt;'s profile" | |
| ☐ | Personalization chips (condition / meds / step goal) editable | Changes persist; Log meds update accordingly |
| ☐ | **Reminders** section: toggle + time presets | See §9 |
| ☐ | Level summary (XP / streak / lessons / badges) | Accurate |
| ☐ | **Achievements**: 5 tracks with 🥉🥈🥇 (earned bright, locked dim) + "X/Y to &lt;tier&gt;" bars | Progress reflects state |
| ☐ | Badges grid: earned vs 🔒 | |
| ☐ | "Reset progress" → confirm dialog → clears journey, **keeps** profile | Onboarding does NOT reappear |

---

## 7. Tabs / navigation

| | Check | Expected |
|---|---|---|
| ☐ | Bottom tab bar sits above the home indicator | Not clipped on gesture-nav devices |
| ☐ | Switching tabs gives a light haptic | |
| ☐ | Active tab icon is larger / blue label | |

---

## 8. Health Connect (steps) — **dev build only**

| | Check | Expected |
|---|---|---|
| ☐ | In Expo Go / web: Activity card shows a graceful "needs a development build" note | No crash |
| ☐ | Dev build, not connected: "Connect Health Connect" button | Tapping → HC permission dialog |
| ☐ | Grant read-steps permission | Card shows today's step count + goal ring |
| ☐ | "Refresh" re-reads steps | Count updates |
| ☐ | "Apply to today" applies steps to the sim once | XP toast; button becomes "Synced ✓" / disabled |
| ☐ | App still launches fine on a device **without** Health Connect installed | No startup crash (lazy-loaded) |

---

## 9. Medication reminders + deep-link — **dev build recommended**

| | Check | Expected |
|---|---|---|
| ☐ | Profile → Reminders → toggle on | Notification permission prompt |
| ☐ | Pick a time a couple minutes out (temporarily) to test firing | Reminder fires at that time |
| ☐ | Reminder text **names your meds** | e.g. "Time to take your Metformin and Statin." |
| ☐ | **Tap the notification** | App opens **directly on the Log tab** (deep-link) |
| ☐ | Tap notification from a **cold start** (app killed) | Opens and lands on Log |
| ☐ | Toggle reminder off | No further reminders |
| ☐ | Deny permission | Card shows an informative note, toggle reverts off |

---

## 10. Accessibility (TalkBack)

| | Check | Expected |
|---|---|---|
| ☐ | Enable TalkBack; swipe through Log tiles | Reads "Log: 30-min walk", not an unlabeled emoji |
| ☐ | Focus the body diagram | Reads "Your body. Heart 82 of 100, Thriving. Kidneys …" |
| ☐ | Focus organ cards / legend | Reads name + score + status + "Tap for details" |
| ☐ | Buttons announce as buttons with their label | |
| ☐ | OS **Reduce Motion** on → re-open app | Animations are skipped/instant; no broken layout |
| ☐ | Large system font | Text scales without major overlap/clipping |

---

## 11. Persistence & lifecycle

| | Check | Expected |
|---|---|---|
| ☐ | Log a few actions, finish a lesson, then **fully close & reopen** | Day count, XP, streak, organs, goals all restored |
| ☐ | Background the app mid-session and return | State intact |
| ☐ | Daily goals **reset on a new calendar day** | New day → goals back to 0/3 |

---

## 12. Regression hotspots (recently changed — check these specifically)

| | Check | Expected |
|---|---|---|
| ☐ | **In-range reward reachable**: a single walk → "+85 XP" and the In Balance badge eventually unlocks | (Was unreachable before a fix) |
| ☐ | **Lived markers persist on Home** after an action (don't snap back to baseline) | Markers reflect your last choice |
| ☐ | **Organ detail sheet scrolls** internally; tapping inside doesn't close it; tapping the dimmed area does | (Sheet backdrop fix) |
| ☐ | Celebration overlay **queues** multiple unlocks (badge + level-up) one after another | No overlap |
| ☐ | App starts fine in **Expo Go** (no crash from the native Health Connect import) | Lazy-load guard works |

---

## Report template

Copy this back for anything that failed:

```
Device: <model / Android version> | Build: Expo Go | dev build
Screen/§: <e.g. §4 Log>
Action: <what you did>
Expected: <from the checklist>
Actual: <what happened>
Notes/screenshot: <optional>
```

> Reminder: this validates *behavior*, not medical accuracy. Effect magnitudes
> and lesson content still need clinician review before any patient use.
