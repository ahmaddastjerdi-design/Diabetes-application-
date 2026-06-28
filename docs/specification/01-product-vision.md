# Diabetes Quest — Volume 1: Product Vision

_Part of the Diabetes Quest Specification Suite — Volume 1 of 10._

**Abstract.** Diabetes Quest is an Android-first digital-health platform for diabetes self-management whose defining differentiator is **cause-and-effect organ-impact visualization**: the patient logs an everyday choice (a sugary drink, a walk, a missed dose) and immediately *sees* a physiological marker move and, over simulated days, watches their heart and kidneys visibly heal or strain. The motivation layer is grounded in Self-Determination Theory (SDT) with deliberately *forgiving* streaks. This volume defines the product vision, the problem it solves, the target market and competitive position, the user personas, the functional and non-functional scope, the product principles and clinical-safety guardrails, and the phased roadmap that carries the existing vertical-slice prototype to a regulated, clinical-grade product. It is the canonical source of intent for all downstream volumes (Android app, doctor panel, backend, medical devices, AI, design system, security/compliance, QA, and the build playbook).

> **Educational-only today.** The current physiology engine is an intentionally simplified, directionally-faithful teaching simulation. It is **not** a medical device and must never be presented as predictive of an individual's health. The regulated clinical capabilities described here are *roadmap targets*, gated behind clinician review, validation, and the compliance work specified in Volume 8.

---

## Table of contents

1. [Executive summary & vision statement](#1-executive-summary--vision-statement)
2. [Problem statement](#2-problem-statement)
3. [Business goals & success metrics](#3-business-goals--success-metrics)
4. [Market analysis (TAM / SAM / SOM)](#4-market-analysis-tam--sam--som)
5. [Competitor analysis](#5-competitor-analysis)
6. [User personas](#6-user-personas)
7. [Functional scope](#7-functional-scope)
8. [Non-functional requirements](#8-non-functional-requirements)
9. [Product principles & guardrails](#9-product-principles--guardrails)
10. [Phased roadmap](#10-phased-roadmap)
11. [KPIs dashboard](#11-kpis-dashboard)
12. [Traceability & cross-references](#12-traceability--cross-references)

---

## 1. Executive summary & vision statement

### 1.1 Vision statement

> **Diabetes Quest helps people with diabetes understand — viscerally, not abstractly — that today's choices shape tomorrow's organs, and turns that understanding into a daily habit they actually keep.**

Most diabetes apps are *trackers*: they record numbers and, at best, bolt points onto the act of logging. They answer "what is my glucose?" but rarely "so what?" Diabetes Quest answers the *so what* by closing the loop between a single choice and its downstream organ impact, then wrapping that insight in an evidence-based motivation system that survives the friction-heavy first weeks of behaviour change.

### 1.2 What it is, in one paragraph

An Android patient app (React Native / Expo) presents a living simulation of the patient's body. Logging diet, exercise, and medication moves four physiological markers — blood glucose, systolic blood pressure, hydration, and LDL cholesterol — within healthy bands; markers that sit in or out of range heal or damage two organs, the **heart** and the **kidneys**, over simulated days. XP, gentle levels, badges, and a forgiving streak (one grace day) carry the patient until the behaviour becomes self-rewarding. The platform's destination — not its present state — is a clinical-grade ecosystem: a clinician web panel, a FHIR-backed backend, medical-device ingestion (CGM/BGM/BP/scale via BLE and Android Health Connect), and a safety-bounded AI Health Coach.

### 1.3 Why now

Three forces converge: (a) CGM and connected-device penetration has made continuous, objective physiological data available to consumers for the first time; (b) the behaviour-change literature now clearly distinguishes apps that *work* (those grounding mechanics in a behavioural framework) from gamified trackers that don't; and (c) Android Health Connect provides a standard, privacy-respecting on-device data fabric that makes real-data integration tractable. Diabetes Quest is positioned to be the app that makes the *consequences* of data legible, not just the data itself.

### 1.4 What success looks like

A newly-diagnosed type-2 patient who, after four weeks, can predict the direction their organs will move *before* logging an action — because the simulation taught them the causal model — and who keeps a forgiving streak alive because the app never shamed them into quitting. At scale: measurable improvements in self-reported adherence and in clinician-validated education comprehension, with a retention curve that beats category benchmarks because intrinsic motivation, not novelty, carries the user.

---

## 2. Problem statement

### 2.1 The self-management gap

Diabetes is overwhelmingly a *self-managed* condition. A person with diabetes spends only a few hours a year with a clinician and makes thousands of consequential choices in between — what to eat, whether to move, whether to take medication on time. Outcomes are dominated by the quality of those between-visit choices, yet the choices are made with weak, delayed, and abstract feedback: a number on a meter, or an HbA1c result quarterly that summarizes ninety days into a single figure with no attribution to specific behaviours.

The result is a **comprehension and motivation gap**:

- **Comprehension gap.** Patients are told "keep your sugar down" without an intuitive model of *why* or of *which organs are at stake and how fast*. Microvascular and macrovascular complications (heart, kidneys, eyes, nerves) are invisible until they are advanced, so the cost of poor choices feels theoretical.
- **Motivation gap.** Even patients who understand the science struggle to sustain daily behaviour. Self-management is a marathon of small, unrewarded acts; the payoff is the *absence* of a future complication, which is a famously weak motivator.

### 2.2 Why trackers underperform

The dominant app pattern is the logbook-plus-points tracker. The evidence base (synthesized in `DESIGN.md`) explains why this underperforms:

1. **Logging is a cost, not a reward.** Trackers ask for data entry and return charts. The act of logging carries friction but little intrinsic payoff, so engagement decays as novelty fades.
2. **Gamification *alone* is not proven.** Reviews repeatedly find that effective apps *ground* mechanics in a behavioural-science framework; bolting XP and badges onto a tracker does not produce durable behaviour change. Points become the only reason to engage, and retention collapses when the points stop being novel.
3. **Punishing streaks backfire.** Streaks that reset to zero exploit loss-aversion and induce guilt, which drives vulnerable users *out* of the app — the opposite of the intended effect.
4. **No causal feedback.** Critically, trackers show *correlation* (a glucose chart) but never *consequence* (what this trend is doing to your kidneys). The patient never builds the mental model that would let them self-correct without the app.
5. **Education is generic.** Top-rated apps personalize to condition type, medication, food culture, and language; most trackers ship one-size-fits-all content.

### 2.3 The opportunity Diabetes Quest addresses

Diabetes Quest is built to be the *consequence engine* the category lacks. By rendering the causal chain **choice → marker → organ health** in real time, it converts logging from a chore into an act of self-discovery, and it teaches a transferable mental model rather than producing a chart the patient must interpret unaided. The SDT motivation layer and forgiving streak are explicitly engineered to avoid the failure modes above.

---

## 3. Business goals & success metrics

Goals carry stable IDs (`BG-NNN`) for traceability. Each is paired with the KPI(s) that measure it (see [§11](#11-kpis-dashboard)).

| ID | Business goal | Rationale | Primary KPI(s) |
|----|---------------|-----------|----------------|
| **BG-001** | Prove that organ-impact visualization drives durable engagement that trackers cannot | This is the core hypothesis and differentiator | KPI-001 (north-star), KPI-002, KPI-003 |
| **BG-002** | Demonstrably improve diabetes *self-management comprehension* | Education is the clinical value proposition | KPI-004, KPI-005 |
| **BG-003** | Reach clinical credibility: clinician-reviewed content and a usable clinician panel | Required to move from educational app to clinical tool | KPI-006, KPI-011 |
| **BG-004** | Integrate real-world device data (CGM/BGM/BP/scale) to ground the simulation in reality | Real data is the bridge from teaching sim to clinical relevance | KPI-007 |
| **BG-005** | Operate to clinical-grade security & compliance standards (HIPAA, GDPR, ISO 27001) | Non-negotiable to handle PHI and partner with clinics | KPI-012, KPI-013 |
| **BG-006** | Build a sustainable acquisition & retention funnel | Commercial viability | KPI-008, KPI-009, KPI-010 |

### 3.1 North-star metric

> **KPI-001 — Weekly Active Habit Rate (WAHR):** the percentage of monthly active patients who log a meaningful action on **≥4 distinct days** in a rolling 7-day window.

WAHR is chosen as the north star because it captures the product's actual mechanism of value — *habitual* engagement with the causal loop — rather than vanity reach (installs) or shallow activity (any open). A patient who logs four-plus days a week is using the consequence engine often enough to build and reinforce the mental model, which is the leading indicator of every downstream goal (comprehension, retention, clinical relevance).

| Phase | WAHR target range |
|-------|-------------------|
| MVP (educational) | 25–35% of MAU |
| Clinical pilot | 40–50% of MAU |
| Regulated product | 50–60% of MAU |

### 3.2 Supporting KPIs

Full definitions and targets are tabulated in [§11](#11-kpis-dashboard). In brief, supporting KPIs span retention (Day-1 / Day-7 / Day-30, streak survival), learning (lessons completed, quiz pass rate, pre/post comprehension lift), clinical (% clinician-reviewed content, device-linked patients, clinician panel adoption), funnel (activation, conversion), and trust/safety (privacy incidents = 0, AI-safety escalation correctness).

---

## 4. Market analysis (TAM / SAM / SOM)

A qualitative framing — precise figures belong in a commercial business plan, not a product-vision spec. The intent is to size the opportunity and define who we serve first.

### 4.1 TAM — Total Addressable Market

All people living with diabetes worldwide who own a smartphone, plus the clinicians and care teams who manage them. Diabetes affects hundreds of millions of adults globally and is growing; the digital diabetes-management software category is one of the largest and fastest-growing segments of digital health. At the platform level, TAM also includes adjacent connected-care revenue (clinic licensing, device partnerships, payer programs).

### 4.2 SAM — Serviceable Addressable Market

Constrained by our deliberate product choices:

- **Platform:** Android-first (Expo / React Native). This *expands* rather than narrows the early SAM in regions where Android dominates and where diabetes prevalence is rising fastest — a strategic alignment, not a limitation.
- **Conditions:** type-2 and type-1 patients who self-manage and are motivated by understanding (the "I want to know why" segment), plus their caregivers.
- **Clinical surface:** endocrinology / diabetology practices and primary-care diabetes programs willing to adopt a patient-education + monitoring panel.
- **Language & culture:** localized content (a top differentiator in the literature) defines which markets are truly serviceable in each phase.

### 4.3 SOM — Serviceable Obtainable Market

What Diabetes Quest can realistically win in the first phases:

- **Beachhead:** newly-diagnosed type-2 patients in the first 6–12 months post-diagnosis — the moment of maximum motivation, maximum confusion, and maximum receptiveness to a teaching tool. This is where organ-impact visualization is most differentiated and most valuable.
- **Wedge into clinics:** diabetes educators and endocrinology practices seeking a *patient-engagement and education* adjunct that does not add clinician workload (the panel surfaces engagement, it does not demand constant review).
- **Expansion:** long-standing type-1 patients (device-data driven), caregivers (especially of children and elderly relatives), and payer/employer wellness programs once clinical evidence accrues.

### 4.4 Go-to-market posture

Lead with the differentiator (see it, don't just track it), enter through the newly-diagnosed beachhead and diabetes educators, and let device integration and the clinician panel pull the product up-market into regulated, reimbursable clinical use over time.

---

## 5. Competitor analysis

The category is mature on *tracking* and *device integration*, and thin on *causal education* and *embodied motivation*. The table scores each competitor qualitatively across five axes plus the dimension that defines Diabetes Quest.

**Legend:** ●●● strong · ●●○ moderate · ●○○ limited · ○○○ absent / not a focus.

| Product | Engagement / motivation | Education | Device integration | Clinical features | Organ-impact (cause→effect) visualization |
|---------|:---:|:---:|:---:|:---:|:---:|
| **mySugr** | ●●● (avatar "diabetes monster", playful tone; MARS engagement leader) | ●●○ (standardized content) | ●●● (BGM, broad meter support) | ●●○ (coaching add-ons, reports) | ○○○ |
| **Glooko** | ●○○ (clinical, not playful) | ●○○ | ●●● (very broad device + clinic integration) | ●●● (population dashboards, clinic workflows) | ○○○ |
| **Dexcom (CGM apps)** | ●●○ (alerts, Clarity reports) | ●○○ | ●●● (best-in-class CGM, native sensor) | ●●● (real-time CGM, share, clinic reports) | ○○○ |
| **LibreView** | ●○○ | ●○○ | ●●● (Libre CGM ecosystem) | ●●● (AGP reports, clinic sharing) | ○○○ |
| **One Drop** | ●●○ (coaching, nudges, predictions) | ●●○ (AI-driven tips) | ●●○ (BGM, integrations) | ●●○ (human + AI coaching) | ○○○ |
| **Diabetes:M** | ●○○ (power-user logging) | ●○○ | ●●○ (bolus calc, imports) | ●●○ (detailed analytics, reports) | ○○○ |
| **Diabetes Quest** | ●●● (SDT-grounded, forgiving streaks, intrinsic + extrinsic) | ●●● (causal model, personalized, clinician-reviewed *roadmap*) | ●●○ → ●●● (Health Connect + BLE on roadmap) | ●○○ → ●●● (clinician panel + FHIR on roadmap) | **●●● (sole differentiator: choice → marker → organ)** |

### 5.1 Reading of the landscape

- **Device integration is table stakes, not a moat.** Dexcom, LibreView, and Glooko already excel here. Diabetes Quest must reach parity (roadmap Phase 2–3) but does not win on integration alone.
- **Clinical reporting is owned by incumbents.** AGP and population dashboards are well served. Diabetes Quest's clinician panel (Volume 3) competes by surfacing *engagement and comprehension*, not by out-reporting Glooko.
- **The white space is causal education + embodied motivation.** *No reviewed competitor renders the consequence of a choice on the patient's organs.* mySugr is the engagement benchmark and One Drop the coaching benchmark, but neither closes the choice → organ loop. This is where Diabetes Quest is structurally different, not merely incrementally better.

### 5.2 Differentiation thesis

> Competitors help you **see your data**. Diabetes Quest helps you **understand your body**. The simulation engine (`src/engine/physiology.ts`) is the product, and the tracking/device features exist to feed it — the inverse of every competitor's architecture.

---

## 6. User personas

Four personas anchor scope and prioritization. Each lists goals, frustrations, and a representative scenario. Persona IDs (`P-NNN`) are referenced by downstream volumes.

### 6.1 P-001 — Aisha, newly-diagnosed type-2 patient (primary / beachhead)

- **Profile:** 46, diagnosed with type-2 three months ago; uses a fingerstick meter occasionally; smartphone-comfortable; overwhelmed by conflicting advice.
- **Goals:** understand what diabetes actually *does* to her body; build a sustainable daily routine; avoid feeling like a "bad patient."
- **Frustrations:** advice is abstract ("eat better, exercise"); numbers don't mean anything to her; existing apps feel like homework; guilt when she slips.
- **Scenario:** Aisha logs a sugary soda at lunch and watches her glucose marker jump out of range and her kidney health tick down on day-advance. That evening she logs a 20-minute walk and sees the glucose come back into the band. For the first time, the link feels *real*. She misses a day mid-week, but the forgiving streak keeps her at it instead of shaming her into deleting the app.
- **Why she matters:** maximum motivation + maximum confusion = the moment organ-impact visualization is most valuable. She is the SOM beachhead.

### 6.2 P-002 — Marcus, long-standing type-1 patient (power user)

- **Profile:** 31, type-1 for 18 years; wears a CGM; data-literate; manages insulin meticulously.
- **Goals:** see real device data reflected without manual logging; spot long-term organ trends his quarterly HbA1c hides; stay motivated after nearly two decades of management fatigue.
- **Frustrations:** manual logging is a non-starter; most "education" is beneath him; gamification feels childish if it isn't substantive.
- **Scenario:** Marcus links his CGM via Health Connect (roadmap Phase 2). His glucose marker is auto-populated; the simulation translates his time-in-range into long-horizon organ trends and a slow HbA1c-style score. The substance — real data, real organ modelling — earns his respect where badges alone would not.
- **Why he matters:** validates the real-data / device-integration thesis (BG-004) and pushes the simulation toward clinical fidelity.

### 6.3 P-003 — Dr. Chen, endocrinologist / diabetologist (clinician)

- **Profile:** endocrinologist managing a large diabetes panel; chronically time-constrained; skeptical of unvalidated tools.
- **Goals:** identify which patients are disengaging *before* the next visit; reinforce education between appointments without adding chart-review burden; trust that any content shown to patients is clinically accurate.
- **Frustrations:** existing dashboards drown her in data; patient apps make medical-sounding claims she can't vouch for; anything that adds clicks to her day is dead on arrival.
- **Scenario:** Dr. Chen opens the clinician panel (Volume 3) and sees an engagement-and-comprehension view: who is keeping their streak, who has stalled, who completed which lessons. She is *never* shown the educational simulation as clinical truth; clinical signals come from device data via FHIR. She reviews and approves lesson content once; thereafter she trusts what her patients see.
- **Why she matters:** clinical credibility (BG-003) and the safety guardrail that the AI/simulation never substitutes for her judgement.

### 6.4 P-004 — Sofia, caregiver (secondary)

- **Profile:** 38, caring for her teenage child with type-1 (and, separately, an elderly parent with type-2); juggles others' health alongside her own life.
- **Goals:** support adherence without nagging; understand the condition well enough to help; receive reassurance, and escalation when something is genuinely wrong.
- **Frustrations:** feels responsible but under-informed; fears missing a serious warning sign; existing apps are built for the patient, not the supporter.
- **Scenario:** With opt-in sharing (roadmap), Sofia sees her child's streak and organ trends and gets a gentle prompt when adherence slips — framed as encouragement, never blame. If a metric crosses a defined safety threshold, the app escalates clearly toward a clinician rather than offering a diagnosis.
- **Why she matters:** drives the relatedness pillar of SDT and the opt-in sharing / escalation requirements that recur in Volumes 2, 6, and 8.

---

## 7. Functional scope

Scope is phased to mirror the roadmap ([§10](#10-phased-roadmap)). Requirement IDs use `FS-NNN`. Phase tags: **M** = MVP / educational, **CP** = clinical pilot, **RP** = regulated product.

### 7.1 In scope

| ID | Capability | Phase | Notes / source |
|----|-----------|:-----:|----------------|
| FS-001 | Organ-impact simulation engine (markers → organs, daily cycle) | M | Exists: `src/engine/physiology.ts` |
| FS-002 | Action logging (diet / exercise / drug) with immediate marker ripple | M | Exists: `LogScreen`, `data/actions.ts` |
| FS-003 | SDT gamification: XP, levels, badges, forgiving streak | M | Exists: `src/engine/gamification.ts` |
| FS-004 | Bite-size lesson quests + check-questions | M | Exists: `LearnScreen`, `data/lessons.ts` |
| FS-005 | Local persisted state (single source of truth) | M | Exists: `GameContext` via AsyncStorage |
| FS-006 | Home dashboard: level, streak, organ health, live markers | M | Exists: `HomeScreen` |
| FS-007 | Profile: badges, level summary, reset | M | Exists: `ProfileScreen` |
| FS-008 | Onboarding & personalization (condition type, meds, food/culture, language) | M→CP | Roadmap item 2 (DESIGN.md §4) |
| FS-009 | Clinician content review workflow (every lesson/effect reviewed) | CP | Roadmap item 1; gates BG-003 |
| FS-010 | Medication reminders (adherence lever) paired with missed-dose mechanic | CP | Roadmap item 4 |
| FS-011 | Real data via Android Health Connect (steps/activity auto-log) | CP | Roadmap item 3; Volume 5 |
| FS-012 | Expanded organs/markers: eyes (retinopathy), nerves (neuropathy), HbA1c slow score | CP | Roadmap item 5 |
| FS-013 | Accounts, auth (OAuth2 / OIDC), cloud sync, backend | CP | Volume 4 |
| FS-014 | Clinician / doctor web panel (engagement + comprehension view) | CP | Volume 3 |
| FS-015 | FHIR R4 data model and clinical data exchange | CP→RP | Volume 4 |
| FS-016 | Medical-device integration via BLE (CGM / BGM / BP / scale) | CP→RP | Volume 5 |
| FS-017 | AI Health Coach (safety-bounded; never diagnoses/prescribes) | CP→RP | Volume 6 |
| FS-018 | Opt-in caregiver / care-team sharing + safety escalation | CP→RP | Personas P-003/P-004; Volume 8 |
| FS-019 | Social / relatedness features (opt-in challenges) | RP | Roadmap item 6 |
| FS-020 | Full accessibility & localization (large-text, screen-reader, multi-language) | M→RP | Roadmap item 7; Volume 7 |

### 7.2 Out of scope (explicitly)

| ID | Excluded item | Reason |
|----|---------------|--------|
| OOS-001 | Diagnosis, dosing, or treatment recommendations | Safety guardrail; not a medical device until regulated phase (and never an autonomous prescriber) |
| OOS-002 | Presenting the educational simulation as a predictor of an individual's real health | Core safety principle (DESIGN.md §5); simulation is directional, not clinical |
| OOS-003 | iOS as a first-class target (initial phases) | Android-first consistency anchor; iOS is a later-phase consideration |
| OOS-004 | Closed-loop / automated insulin delivery control | Out of platform scope; high-risk regulated territory |
| OOS-005 | Bolus calculator as a clinical tool | Until validated and regulated; avoid in educational/pilot phases |
| OOS-006 | AI giving unsupervised clinical advice | AI is bounded; escalates to clinicians (Volume 6) |
| OOS-007 | Selling or sharing patient PHI for advertising | Privacy/trust principle; GDPR/HIPAA posture |

---

## 8. Non-functional requirements

Requirement IDs use `NFR-NNN`. Targets are platform aspirations for the clinical-pilot phase onward unless noted; the MVP prototype is held to the subset achievable on-device.

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-001 | Performance — app cold start | Time to interactive Home screen on a mid-range Android device | ≤ 2.5 s |
| NFR-002 | Performance — interaction latency | Log-action → marker ripple visible | ≤ 100 ms (perceived instant) |
| NFR-003 | Performance — simulation step | `advanceDay` compute time | ≤ 16 ms (one frame) |
| NFR-004 | Performance — sync | Background device/cloud sync round-trip (CP+) | ≤ 5 s p95 |
| NFR-005 | Availability — backend | Backend / clinician panel uptime (CP+) | ≥ 99.9% monthly |
| NFR-006 | Availability — offline | Core loop (log, simulate, learn) fully functional offline | 100% offline-capable |
| NFR-007 | Scalability | Concurrent active patients supported without redesign (RP) | ≥ 1,000,000 registered / 100k DAU |
| NFR-008 | Scalability — clinic | Patients per clinician panel without UX degradation | ≥ 2,000 panel size |
| NFR-009 | Accessibility | WCAG 2.2 AA; full TalkBack screen-reader support; dynamic type; min contrast | AA conformance; Volume 7 |
| NFR-010 | Accessibility — localization | Localized UI + content (language, units, food/culture) | ≥ 3 languages by CP |
| NFR-011 | Privacy — data residency | PHI handling per HIPAA/GDPR; on-device-only in MVP | 0 PHI off-device in MVP |
| NFR-012 | Privacy — encryption | Encryption in transit (TLS 1.2+) and at rest (AES-256) for PHI | Mandatory CP+ |
| NFR-013 | Security | OWASP MASVS / Mobile Top 10 conformance; OAuth2/OIDC auth | Volume 8 |
| NFR-014 | Reliability — data integrity | No silent loss/corruption of logged data or progress | 0 tolerated; durable writes |
| NFR-015 | Maintainability | TypeScript strict; `typecheck` + smoke/automated tests green on CI | Volume 9 / 10 |
| NFR-016 | Battery / resource | BLE + Health Connect sync within reasonable battery budget | ≤ 3% battery/day from sync |
| NFR-017 | Compliance auditability | Audit logging of PHI access and clinical actions | Immutable audit trail CP+ |
| NFR-018 | Safety — escalation | Defined thresholds escalate to clinician path; AI never diagnoses | 100% of escalations routed; Volume 6/8 |

---

## 9. Product principles & guardrails

These principles are binding constraints on every downstream volume. Violating one is a defect, not a trade-off.

### 9.1 Educational framing (PR-001)

The simulation teaches the *direction* of cause and effect, never clinical values for an individual. The MVP is and says it is educational-only, on the dashboard itself. Any move toward clinical claims is gated behind validation and the regulated-product phase. The simulation must never be presented as predictive of a real person's health (OOS-002, DESIGN.md §5).

### 9.2 Clinical safety first (PR-002)

- **No diagnosis, no prescription, ever autonomously.** The AI Health Coach and the app surface education and encouragement; clinical judgement belongs to clinicians (P-003).
- **Clear escalation.** Defined safety thresholds route the patient/caregiver toward a clinician rather than offering an answer (NFR-018, FS-018).
- **Clinician-reviewed content.** Every lesson and every effect magnitude is clinician-reviewed before any real-world pilot (FS-009, roadmap item 1).

### 9.3 Motivation grounded in science (PR-003)

- **Anchor to Self-Determination Theory.** Every mechanic must serve autonomy, competence, or relatedness — or it does not ship.
- **Rewards are scaffolding, not the building.** XP and badges carry the user through the hard first weeks until the organ feedback becomes intrinsically rewarding. XP is never the *sole* reason to engage.
- **Forgiving streaks, always.** A missed day is forgiven via a grace day; a broken streak restarts at 1, never shames to 0 (`gamification.ts`). Punishing streaks are prohibited.

### 9.4 Differentiator integrity (PR-004)

The cause-and-effect organ-impact loop (choice → marker → organ) is the product's reason to exist. Tracking and device features exist to *feed* the simulation, not to replace it. Roadmap pressure must never dilute the loop into "just another tracker."

### 9.5 Privacy & trust (PR-005)

PHI is never sold or used for advertising (OOS-007). On-device-by-default in the MVP; explicit, granular consent for any sharing (caregiver, clinician, cloud). HIPAA + GDPR + ISO 27001 posture from the clinical-pilot phase (Volume 8).

### 9.6 Design language (PR-006)

Material Design 3 throughout the Android app; the clinician panel is web with a coherent, accessible visual system (Volume 7). Accessibility (WCAG 2.2 AA, TalkBack, dynamic type) is a requirement, not a feature.

---

## 10. Phased roadmap

The roadmap maps directly onto the existing repo roadmap in `DESIGN.md §4` and extends it toward a regulated product. Three phases, each with an explicit exit gate.

### Phase 1 — MVP (educational) — *current state*

**Theme:** validate the concept. **Status:** working vertical-slice prototype exists.

- Organ-impact simulation, SDT gamification, lessons, local persistence, 4 screens (FS-001–FS-007). ✅ built.
- Onboarding & personalization scaffold (FS-008, partial), baseline accessibility/localization groundwork (FS-020).
- **Exit gate G1:** concept validated against WAHR MVP target (25–35% of MAU), comprehension lift demonstrated (KPI-004/005), and a green CI (typecheck + smoke/automated tests).

### Phase 2 — Clinical pilot

**Theme:** ground in reality and put it in clinicians' hands. Maps to `DESIGN.md` roadmap items 1–5.

- Clinician content review workflow (FS-009) — **the gating item** for any real-world pilot.
- Medication reminders + missed-dose mechanic (FS-010).
- Real data via Android Health Connect (FS-011); expanded organs/markers incl. HbA1c slow score (FS-012).
- Accounts, OAuth2/OIDC auth, backend, FHIR data model, cloud sync (FS-013, FS-015 partial; Volume 4).
- Clinician / doctor web panel (FS-014; Volume 3).
- HIPAA/GDPR/ISO 27001 controls, audit logging, encryption (NFR-011/012/017; Volume 8).
- **Exit gate G2:** clinician-reviewed content shipped; device data flowing for pilot cohort; clinician panel adopted by pilot clinics; security controls passed; WAHR 40–50%.

### Phase 3 — Regulated product

**Theme:** clinical-grade platform. Maps to `DESIGN.md` roadmap items 6–8 and beyond.

- Medical-device integration via BLE: CGM / BGM / BP / scale (FS-016; Volume 5).
- AI Health Coach, safety-bounded, with clinician escalation (FS-017; Volume 6).
- Opt-in caregiver / care-team sharing + escalation (FS-018).
- Social / relatedness features (FS-019); full accessibility & localization (FS-020 complete).
- Full OWASP MASVS conformance, formal compliance posture, regulatory pathway as applicable (Volume 8).
- **Exit gate G3:** validated clinical capabilities, full compliance certification posture, WAHR 50–60%, zero privacy incidents sustained.

| Phase | Maps to DESIGN.md roadmap | Defining deliverable | Exit gate |
|-------|---------------------------|----------------------|-----------|
| 1 — MVP | (current prototype) | The organ-impact loop, validated | G1 |
| 2 — Clinical pilot | Items 1–5 | Clinician-reviewed content + real data + panel | G2 |
| 3 — Regulated product | Items 6–8 + | Device integration, AI coach, compliance | G3 |

---

## 11. KPIs dashboard

All KPIs carry stable IDs and target ranges per phase. The north star (KPI-001) governs; the rest are leading or lagging indicators of the business goals in [§3](#3-business-goals--success-metrics).

| ID | KPI | Definition | MVP target | Clinical-pilot target | Regulated target | Goal |
|----|-----|-----------|:----------:|:---------------------:|:----------------:|------|
| **KPI-001** | Weekly Active Habit Rate (north star) | % MAU logging on ≥4 distinct days / 7 | 25–35% | 40–50% | 50–60% | BG-001 |
| **KPI-002** | Day-1 retention | % new users active next day | ≥ 45% | ≥ 55% | ≥ 60% | BG-001 |
| **KPI-003** | Day-30 retention | % new users active at day 30 | ≥ 15% | ≥ 25% | ≥ 35% | BG-001 |
| **KPI-004** | Comprehension lift | Pre/post quiz score improvement | ≥ +20% | ≥ +30% | ≥ +35% | BG-002 |
| **KPI-005** | Lessons completed / active user | Mean lessons finished per active user / month | ≥ 2 | ≥ 3 | ≥ 4 | BG-002 |
| **KPI-006** | Clinician-reviewed content | % of lessons + effect magnitudes clinician-reviewed | 0% → in progress | 100% | 100% | BG-003 |
| **KPI-007** | Device-linked patients | % active patients with ≥1 linked device/data source | n/a | ≥ 30% | ≥ 60% | BG-004 |
| **KPI-008** | Activation rate | % installs completing onboarding + first log | ≥ 50% | ≥ 60% | ≥ 65% | BG-006 |
| **KPI-009** | Streak survival (7-day) | % users keeping a streak ≥7 days | ≥ 20% | ≥ 30% | ≥ 40% | BG-001 |
| **KPI-010** | Forgiving-streak recovery | % users who resume after a missed day (vs. churn) | ≥ 60% | ≥ 70% | ≥ 75% | BG-006 |
| **KPI-011** | Clinician panel adoption | % pilot clinicians active weekly on panel | n/a | ≥ 50% | ≥ 60% | BG-003 |
| **KPI-012** | Privacy incidents | Confirmed PHI breaches / data-loss events | 0 | 0 | 0 | BG-005 |
| **KPI-013** | AI-safety escalation correctness | % of threshold events correctly escalated, 0 diagnoses given | n/a | 100% | 100% | BG-005 |

> KPI instrumentation, event taxonomy, and dashboards are specified operationally in Volume 9 (QA & testing) and Volume 4 (backend analytics); privacy-preserving measurement is constrained by Volume 8.

---

## 12. Traceability & cross-references

This volume is the source of intent. Each sibling volume elaborates a slice of the vision and inherits its principles ([§9](#9-product-principles--guardrails)), scope IDs (`FS-*`, `OOS-*`), personas (`P-*`), NFRs (`NFR-*`), and KPIs (`KPI-*`).

| Volume | File | Inherits from this volume |
|--------|------|---------------------------|
| 01 — Product Vision | [`01-product-vision.md`](01-product-vision.md) | — (this document) |
| 02 — Android App PRD | [`02-android-app-prd.md`](02-android-app-prd.md) | FS-001–FS-008, FS-020; P-001/P-002/P-004; PR-003/PR-004/PR-006; NFR-001/002/006/009 |
| 03 — Doctor Panel | [`03-doctor-panel.md`](03-doctor-panel.md) | FS-014; P-003; BG-003; KPI-006/011; NFR-005/008/017 |
| 04 — Backend | [`04-backend.md`](04-backend.md) | FS-013/FS-015; NFR-004/005/007/011/012/014/017; KPI instrumentation |
| 05 — Medical Devices | [`05-medical-devices.md`](05-medical-devices.md) | FS-011/FS-016; BG-004; P-002; NFR-016; KPI-007 |
| 06 — AI System | [`06-ai-system.md`](06-ai-system.md) | FS-017; PR-002; OOS-001/OOS-006; NFR-018; KPI-013; P-003/P-004 |
| 07 — UI/UX Design System | [`07-uiux-design-system.md`](07-uiux-design-system.md) | PR-006; NFR-009/010; FS-006/FS-007/FS-020 (Material Design 3) |
| 08 — Security & Compliance | [`08-security-compliance.md`](08-security-compliance.md) | PR-005; BG-005; NFR-011/012/013/017; OOS-007; KPI-012 |
| 09 — QA & Testing | [`09-qa-testing.md`](09-qa-testing.md) | NFR-014/015; all KPIs (instrumentation & validation); exit gates G1–G3 |
| 10 — Claude Code Build Playbook | [`10-claude-code-build-playbook.md`](10-claude-code-build-playbook.md) | Roadmap phasing ([§10](#10-phased-roadmap)); FS-* build order; NFR-015 |

**Upstream source documents (repo):** [`README.md`](../../README.md), [`DESIGN.md`](../../DESIGN.md), `src/engine/physiology.ts`, `src/engine/gamification.ts`, `src/data/actions.ts`, `src/data/lessons.ts`, `src/state/GameContext.tsx`.

---

_End of Volume 1 — Product Vision._
