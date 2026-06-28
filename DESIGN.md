# Design & Research — Diabetes Quest

This document captures the prior-art research that shaped the app and the design
decisions that follow from it.

---

## 1. What the research says (the "study the best first" findings)

### Best-in-class projects reviewed

**Commercial / clinically rated**
- **mySugr** — repeatedly scores highest on the Mobile App Rating Scale for
  engagement: a playful avatar ("the diabetes monster"), motivational prompts,
  and standardized education content. Our north star for *tone and engagement*.

**Academic serious games (closest to this concept)**
- **DiaPo** — a mobile serious game for type 2 diabetes built by a
  multidisciplinary team (medical informatics + game design + diabetes care). It
  used the **ADDIE** instructional-design model and the **MDA** game-design
  framework. This is the most direct blueprint for what we're building.
- **Diaquarium** — a serious game for children with type 1 diabetes, studied
  specifically for *which in-game reward mechanisms* drive engagement.

**Open-source React Native / Android references**
- `GlucoseTracker`, `Jackie` — RN diabetes/health-assistant apps (code patterns).
- `react-native-health-connect` — the right way to pull real activity data
  (steps/calories) on Android via Health Connect for future real-data goals.

### Key evidence-based conclusions

1. **Diabetes self-management apps work; gamification *alone* is not proven.**
   The reviews are clear that effective apps *ground* game mechanics in a
   behavioral-science framework rather than bolting points onto a tracker.
2. **Anchor to Self-Determination Theory (SDT).** Durable motivation needs
   *autonomy* (you chose this), *competence* (you're visibly improving), and
   *relatedness* (you're not alone). Every mechanic should serve one of these.
3. **Points/badges are scaffolding, not the building.** Extrinsic rewards exist
   to carry the user across the friction-heavy first weeks until the behavior
   becomes intrinsically rewarding. If XP is the *only* reason to engage,
   retention collapses when novelty fades.
4. **Don't punish streaks.** Streaks that reset to zero and induce guilt exploit
   loss-aversion and ultimately drive people *out* of the app.
5. **Education must be evidence-based, adaptable, and localized.** Personalized
   goals, local food/language options, and reminder systems were the
   differentiators in the top-rated apps.

### Where this app is different

None of the reviewed apps do **organ-impact visualization** — showing the causal
chain from *choice → marker → organ health* — well. That is this app's
differentiator and the reason the simulation engine is the centerpiece.

### Sources

- mySugr / MARS comparative analysis — https://pmc.ncbi.nlm.nih.gov/articles/PMC12089714/
- DiaPo serious game (Heliyon, 2024) — https://pmc.ncbi.nlm.nih.gov/articles/PMC11447347/
- T1 gamification app review (J Multidiscip Healthc) — https://www.tandfonline.com/doi/full/10.2147/JMDH.S249664
- T2 diabetes education co-design study — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10546275/
- Gamification & behavior change (JMIR Serious Games) — https://games.jmir.org/2024/1/e43078
- SDT-based gamification analysis — https://catsol.com/gamification-in-health-behavior-change/
- react-native-health-connect — https://github.com/Haider-Mukhtar/ReactNative-Health-Connect

---

## 2. The simulation model (`src/engine/physiology.ts`)

A deliberately simplified, **directionally faithful** model — it teaches the
*direction* of relationships, not clinical values.

**Markers** (each with a healthy band and a daily baseline that sits slightly
out of range, so doing nothing drifts you down and good choices bring you in):

| Marker | Healthy band | Baseline |
|--------|--------------|----------|
| Blood glucose | 80–140 mg/dL | 150 |
| Blood pressure (systolic) | 100–130 mmHg | 135 |
| Hydration | 60–100 % | 55 |
| LDL cholesterol | 40–100 mg/dL | 108 |

**Organs** are damaged in proportion to how far their sensitive markers sit
*outside* their band, weighted by sensitivity:

- **Heart** ← systolic (1.0), LDL (0.8), glucose (0.5)
- **Kidneys** ← glucose (1.0), systolic (0.9), hydration (0.6)

**Daily cycle** (reset-to-baseline model, chosen for controllability — no
unbounded marker drift across days):
1. The patient logs actions; each action moves markers from baseline.
2. On day-advance, organs **heal** (+1.5) if all sensitive markers were in range,
   else take damage scaled by average deviation.
3. Markers reset to baseline for a fresh next day.

This is validated by `src/engine/__smoke__.ts`: a healthy routine raises organ
health, a poor routine lowers it, and organ health always stays within [0, 100].

---

## 3. The motivation layer (`src/engine/gamification.ts`)

Mapped explicitly to SDT:

- **Autonomy** — the patient freely chooses which actions to log and which goals
  to chase.
- **Competence** — XP, a gentle quadratic level curve, and visible organ
  improvement make progress legible.
- **Relatedness** — badges/milestones (social/leaderboard features are roadmap).

Deliberate choices from the evidence:
- **Forgiving streak** — one missed day is forgiven via a grace day; a broken
  streak restarts at 1, never shaming the user to 0.
- **Rewards as scaffolding** — XP is layered on top of the intrinsically
  meaningful organ feedback, not as the sole driver.

---

## 4. Roadmap

Done:

- ✅ **Onboarding & personalization** — name, condition, current medications, and
  a self-chosen step goal (`screens/OnboardingScreen.tsx`, `data/profile.ts`).
  Medications tailor the Log screen; condition/name personalize copy; everything
  is editable later on the Profile screen.
- ✅ **Real data via Health Connect (Android)** — `services/healthConnect.ts`
  reads today's steps and `ActivityCard` applies them to the simulation
  (lazy-loaded + guarded so the app runs without a dev build too).

Near-term, in rough priority order:

1. **Clinician content review** — every lesson and effect magnitude reviewed for
   accuracy and safe framing before any real-world pilot.
2. **Background step sync & auto-apply** — read steps on launch/resume and offer
   to apply without a manual tap; add distance/active-calorie records.
3. **Localization** — food/culture and language options (a top differentiator in
   the literature), building on the personalization profile.
4. **Medication reminders** — adherence is a proven lever; pair with the
   "missed dose" mechanic already modeled and the meds captured at onboarding.
5. **More organs & markers** — eyes (retinopathy), nerves (neuropathy), HbA1c as
   a slow long-term score.
6. **Social/relatedness** — opt-in challenges or care-team sharing.
7. **Accessibility** — large-text and screen-reader passes.
8. **Automated tests** — promote the smoke checks into a Jest suite; add UI tests.

## 5. Safety & scope

- The app is **educational**, not a medical device, and says so on the dashboard.
- The model must never be presented as predictive of an individual's real health.
- Before any pilot with real patients: clinician review, a privacy review (no PII
  leaves the device today — all state is local via AsyncStorage), and clear
  consent/disclaimer flows.
