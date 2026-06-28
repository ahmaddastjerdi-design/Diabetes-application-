# Volume 3 — Doctor / Clinician Panel

_Part of the Diabetes Quest Specification Suite — Volume 3 of 10._

## Abstract

This volume specifies the **Doctor / Clinician Panel** for Diabetes Quest: a
secure, web-based companion to the Android patient app that lets a care team
observe, interpret, and act on the data their patients generate. Where the
patient app (Volumes 1–2) is an Android-first, gamified, educational experience
built around an organ-impact simulation, the clinician panel is a
**responsive, desktop-first React web application** that turns the same data
model into clinical workflows: population dashboards, individual patient
timelines, ambulatory-glucose-profile (AGP)-style trend graphs, the organ-health
trend view that is the platform's signature differentiator, decision-support
alerts, secure messaging, remote monitoring with alert triage, and exportable
clinical reports.

The panel is explicitly a **clinician aid, not an autonomous diagnostic or
prescribing system**. Every rule it surfaces — time-in-range thresholds,
hypo/hyperglycaemia alerts, missed-data alerts, risk stratification — is labelled
as a decision support cue requiring human clinical judgement. Consistent with
the suite's anchors, the panel uses **HL7 FHIR R4** as its data contract,
**OAuth2 / OIDC** for authentication, **Material Design 3** (web adaptation) for
its design language, and is engineered to **HIPAA / GDPR / ISO 27001** and
**WCAG 2.1 AA** standards. Today the platform is an educational prototype; this
document specifies the panel as a target state and is written so it can be built
incrementally against that goal.

> ⚕️ **Scope note.** The Diabetes Quest physiological model is an intentionally
> simplified teaching simulation. The clinician panel presents both
> patient-reported / device-measured clinical data **and** the educational
> simulation, and must keep the two visually and semantically distinct so a
> clinician is never misled into treating simulated organ-health scores as
> measured pathology.

---

## Table of contents

1. [Overview](#1-overview)
2. [Intended clinical users & jobs-to-be-done](#2-intended-clinical-users--jobs-to-be-done)
3. [Web technical approach](#3-web-technical-approach)
4. [Roles, access control & consent model](#4-roles-access-control--consent-model)
5. [Information architecture](#5-information-architecture)
6. [Screen & area specification](#6-screen--area-specification)
7. [Decision-support rules](#7-decision-support-rules)
8. [Functional requirements](#8-functional-requirements)
9. [Clinical safety, liability & audit](#9-clinical-safety-liability--audit)
10. [Reporting & export](#10-reporting--export)
11. [Non-functional requirements](#11-non-functional-requirements)
12. [FHIR resource map](#12-fhir-resource-map)
13. [Traceability & cross-references](#13-traceability--cross-references)

---

## 1. Overview

The clinician panel is the care-team side of a two-sided product. Patients use
the Android app to log diet, exercise, and medication, optionally stream device
data (CGM, BP cuff, scale — see `05-medical-devices.md`), and learn through the
organ-impact simulation. The panel lets clinicians:

- **See** each patient's clinical and behavioural data over time, at population
  and individual scale.
- **Interpret** it with AGP-style trend visualisations and the organ-health
  trend view, supported by clearly-labelled decision-support cues.
- **Triage** remotely — find the patients who need attention today out of a
  panel of hundreds.
- **Act** — message the patient, adjust shared goals, generate a clinical
  summary, escalate, or document a clinical note.

Three design principles govern the panel:

1. **Clinician aid, never autonomous clinician.** No screen produces a
   diagnosis, a prescription, or a dosing instruction. The AI layer
   (`06-ai-system.md`) summarises and flags; it escalates to humans and never
   acts alone.
2. **One data model, two front-ends.** The panel and the app read and write the
   same FHIR-backed records through the backend (`04-backend.md`). A glucose
   reading, a logged meal, a medication, or a goal is the same resource on both
   sides.
3. **Consent gates everything.** A clinician sees a patient's data only while an
   active, auditable consent links them. Revoking consent revokes access.

---

## 2. Intended clinical users & jobs-to-be-done

| User | Context | Primary jobs-to-be-done |
|------|---------|-------------------------|
| **Endocrinologist / diabetologist** | Specialist managing complex / insulin-dependent patients | Review AGP & time-in-range; assess glycaemic variability and trend; adjust therapy targets (documented as recommendations, executed in the EHR of record); evaluate organ-risk trajectory; sign off clinical summaries |
| **Diabetes nurse educator** | Front-line coaching, education, adherence | Monitor adherence (logging, medication, device wear); spot patients drifting off-track; deliver education and motivation via secure messaging; set and adjust patient-facing goals; run remote-monitoring triage |
| **Primary-care physician (PCP)** | Generalist managing many chronic conditions | Get a fast, low-friction snapshot per patient; catch red-flag alerts; decide who needs specialist referral; export a summary into the patient's chart |
| **Care coordinator** | Operational orchestration across a panel | Run the population dashboard; manage risk stratification queues; assign / reassign patients; track outreach; ensure no flagged patient falls through the cracks (non-clinical actions only) |

Jobs-to-be-done are mapped to screens in [§5](#5-information-architecture) and to
functional requirements in [§8](#8-functional-requirements). The **care
coordinator role is non-clinical**: it can manage queues, assignments, and
outreach status but cannot view free-text clinical notes authored by clinicians
or author clinical recommendations (enforced in [§4](#4-roles-access-control--consent-model)).

---

## 3. Web technical approach

### 3.1 Platform & stack

- **React web application** (React 19), TypeScript, built with Vite.
- **Responsive, desktop-first.** The primary target is a clinician at a desktop
  or laptop (≥ 1280 px); the layout degrades gracefully to tablet (≥ 768 px) for
  ward-round / bedside use. It is **not** a phone-first experience — the patient
  app owns mobile.
- **Routing & data:** React Router; TanStack Query for server-state caching,
  background refetch, and optimistic updates against the FHIR API.
- **Charts:** a declarative charting layer (e.g. Visx / D3 primitives) for AGP,
  trend, and organ-health visualisations, chosen for accessibility hooks and SVG
  export.
- **Auth:** OAuth2 / OIDC Authorization Code + PKCE against the platform identity
  provider; short-lived access tokens, refresh rotation, SMART-on-FHIR scopes
  (`08-security-compliance.md`).

### 3.2 Shared design system

The panel consumes the **Diabetes Quest design system** (`07-uiux-design-system.md`)
as a **web adaptation of Material Design 3**:

- **Design tokens are shared** with the patient app — colour, type scale,
  spacing, elevation, and especially the **organ-health and marker status
  palettes** (e.g. the green→amber→red status colours and "Thriving / Healthy /
  Strained / At risk / Critical" labels defined in `physiology.ts`) are imported
  from a single tokens package so a "Strained" kidney looks identical on both
  sides.
- **Material 3 web components** (data tables, navigation rail, dialogs, chips,
  snackbars) provide density modes appropriate to data-dense clinical screens
  ("comfortable" default, "compact" for roster tables).
- **Iconography and organ glyphs** (heart, kidney, and roadmap organs — eyes,
  nerves) are shared assets, ensuring a patient and clinician discussing "your
  heart" are looking at the same symbol.

### 3.3 Shared data model

The panel and app share the model defined in `physiology.ts` and extended by the
backend:

- **Markers:** `glucose` (mg/dL, healthy 80–140), `systolic` blood pressure
  (mmHg, healthy 100–130), `hydration` (%, healthy 60–100), `ldl` cholesterol
  (mg/dL, healthy 40–100).
- **Organs:** `heart` (sensitive to systolic 1.0, LDL 0.8, glucose 0.5) and
  `kidney` (glucose 1.0, systolic 0.9, hydration 0.6); roadmap organs per
  `DESIGN.md` (eyes, nerves, HbA1c as a slow long-term score).
- **Organ health** is a 0–100 score with qualitative bands. In the panel these
  educational/simulation values are **always rendered in a visually distinct
  "Educational simulation" frame** and never co-plotted on a clinical axis with
  measured labs.

Clinical truth (real CGM/BP/lab values) and simulation output are stored as
distinct FHIR resources (see [§12](#12-fhir-resource-map)) and styled distinctly.

---

## 4. Roles, access control & consent model

### 4.1 Roles

| Role | Description | May view clinical data | May author clinical notes / recommendations | May message patients | Admin functions |
|------|-------------|:----------------------:|:------------------------------------------:|:--------------------:|:---------------:|
| **Clinician** | Endocrinologist, PCP, or other licensed clinician | ✅ (consented patients) | ✅ | ✅ | — |
| **Nurse** | Diabetes nurse educator / RN | ✅ (consented patients) | ✅ (notes; recommendations per local policy) | ✅ | — |
| **Admin** | Practice / IT administrator | ❌ (no clinical content) | ❌ | ❌ | ✅ user & org management, audit review, configuration |
| **Care coordinator** | Operational orchestration | Limited (status/metrics, not free-text clinical notes) | ❌ | ✅ (outreach templates) | Queue & assignment management |

Roles are coarse RBAC; fine-grained access is further constrained by **patient
consent** and **care-team membership** (ABAC). A clinician with the `clinician`
role still sees only patients to whom they are linked by an active consent and
care-team assignment. The `admin` role is deliberately **walled off from clinical
content** — admins manage accounts, organisations, and audit, and cannot open a
patient timeline. This separation is a HIPAA minimum-necessary control.

### 4.2 Consent model (gates access)

Access to any patient's data is gated by an explicit, revocable consent captured
in the **patient app** and represented as a FHIR `Consent` resource:

1. **Grant.** The patient (or authorised guardian) grants a named clinician or
   care team access, choosing a scope (e.g. full record vs. glucose-only) and an
   optional expiry. This produces a `Consent` with `status = active`, a `scope`,
   `provision` actors, and `period`.
2. **Enforcement.** Every API request from the panel is checked against active
   `Consent` resources; data outside the consented scope is filtered server-side
   (`04-backend.md`). The panel never receives un-consented data.
3. **Expiry & revocation.** When a patient revokes consent or it expires, the
   panel loses access immediately on next request; any open session is
   invalidated within the freshness window ([§11](#11-non-functional-requirements)).
   Revocation is itself an audited event.
4. **Break-glass (emergency access)** is **out of scope** for the standard panel;
   if introduced, it requires a separate, heavily-audited workflow and is not
   assumed here.

Consent state is always visible in the panel: a patient whose consent has
lapsed appears in the roster as **"Access ended"** with their detail screens
locked.

---

## 5. Information architecture

```
Login / MFA
└── (authenticated shell: navigation rail + top bar)
    ├── Population dashboard            ← landing for care coordinator / nurse
    │   ├── Risk stratification queues
    │   └── Remote-monitoring triage / alert inbox
    ├── Patient roster                  ← searchable, filterable panel list
    │   └── Individual patient record
    │       ├── Overview / timeline
    │       ├── Glucose & marker trends (AGP-style)
    │       ├── Organ-health trend (simulation)
    │       ├── Decision support & alerts
    │       ├── Secure messaging
    │       ├── Clinical summary / reports
    │       └── Notes & care plan
    ├── Reports (panel-level exports)
    └── Admin (admin role only)
        ├── Users & roles
        ├── Audit log
        └── Org configuration
```

The default landing screen is **role-dependent**: clinicians land on their
alert-prioritised roster; care coordinators and nurses land on the population
dashboard.

---

## 6. Screen & area specification

Each area below lists **purpose**, **key data shown**, **primary actions**,
**states**, and **backing FHIR resources**.

### 6.1 Login & MFA

- **Purpose.** Authenticate the clinician and establish an auditable session.
- **Key data shown.** Org branding, sign-in (OIDC), MFA challenge, legal /
  privacy notice, last-login indicator.
- **Primary actions.** Sign in via identity provider; complete MFA (TOTP / WebAuthn
  / push); recover access; sign out.
- **States.** Unauthenticated → credentials accepted → MFA pending → MFA passed
  → session active; error states (locked account, expired session, MFA failure,
  IdP unreachable); idle-timeout warning before auto-logout.
- **FHIR / identity.** Not FHIR-backed; OAuth2/OIDC + `Practitioner` /
  `PractitionerRole` identity binding. MFA is mandatory for all roles
  (`08-security-compliance.md`).

### 6.2 Patient roster

- **Purpose.** The clinician's working list of consented patients, sortable by
  clinical urgency.
- **Key data shown.** Per patient: name / ID, last sync, glucose **time-in-range
  (TIR)** summary, active-alert badge and severity, adherence indicator (logging
  / device wear), consent status, assigned clinician. Sort defaults to **highest
  unresolved alert severity first**.
- **Primary actions.** Search / filter (by alert, risk tier, last sync, assigned
  clinician, condition); open a patient; bulk-acknowledge informational alerts;
  reassign (coordinator).
- **States.** Loading; populated; empty (no consented patients); filtered-empty;
  patient rows in normal / alerted / "Access ended" (consent lapsed) /
  stale-data states.
- **FHIR.** `Patient`, `CareTeam`, `Consent`, plus summarised `Observation`
  (latest glucose / TIR), `Flag` (active alerts), and `DetectedIssue`.

### 6.3 Individual patient timeline (Overview)

- **Purpose.** A single chronological narrative of a patient's diabetes journey.
- **Key data shown.** Unified timeline merging glucose/marker readings, logged
  meals & exercise, medication events and adherence, device connections, messages,
  clinician notes, alerts, and goal changes. Header shows demographics, condition,
  current targets, consent scope, care team.
- **Primary actions.** Scrub / zoom the time range (24 h, 7 d, 14 d, 30 d, 90 d,
  custom); filter by event type; jump to a flagged event; open any item's detail;
  add a clinical note; start a message.
- **States.** Loading; populated; sparse-data (new patient); stale (no recent
  sync — banner); consent-limited (some lanes hidden by scope).
- **FHIR.** `Observation` (glucose, BP, weight, labs), `MedicationStatement` /
  `MedicationAdministration`, `NutritionIntake`/`Observation` (logged meals),
  `Observation` (activity / exercise), `Communication`, `Flag`, `CarePlan`,
  `Goal`, `Provenance`.

### 6.4 Glucose & marker trend graphs (AGP-style)

- **Purpose.** Interpret glycaemic patterns the way clinicians already read an
  **Ambulatory Glucose Profile**, extended to the platform's other markers.
- **Key data shown.**
  - **AGP-style glucose panel:** a modal-day plot overlaying the selected period
    into a single 24-hour view with **median**, **IQR (25–75%)**, and
    **10–90% percentile** bands, the target range (80–140 mg/dL) shaded, and
    summary metrics: **Time-in-Range (TIR)**, Time-Above-Range (TAR, split high /
    very-high), Time-Below-Range (TBR, split low / very-low), **Glucose
    Management Indicator (GMI)**, mean glucose, and **coefficient of variation
    (CV%)** for glycaemic variability.
  - **Daily glucose traces** ("daily snapshots") stacked for the period.
  - **Companion marker trends:** systolic BP, hydration, LDL — each with its
    healthy band shaded (per `physiology.ts`) and in-range/out-of-range
    annotation.
  - **Data-sufficiency indicator** (e.g. "% of period with CGM data") so the
    clinician knows how much to trust the AGP.
- **Primary actions.** Change period; toggle markers; toggle percentile bands;
  hover for point detail; mark a pattern for the summary; export the chart
  (SVG/PNG) into a report.
- **States.** Sufficient data (full AGP); insufficient data (AGP suppressed with
  explicit "not enough data for a reliable AGP" message rather than a misleading
  partial chart); device-only vs. mixed device/manual entry distinguished
  visually.
- **FHIR.** `Observation` (CGM glucose with `device` reference, BP, hydration
  proxy, LDL lab), `Device`, `DeviceMetric`; derived metrics surfaced as computed
  `Observation`s or in a `DiagnosticReport`.

### 6.5 Organ-health trend view (the differentiator)

- **Purpose.** Show the platform's signature **choice → marker → organ** causal
  story over time — the differentiator called out in `README.md` / `DESIGN.md` —
  as a longitudinal clinician view, while keeping it unambiguously **educational**.
- **Key data shown.** Heart and kidney health (0–100) trends over the period with
  the qualitative bands (Thriving / Healthy / Strained / At risk / Critical) and
  their colours; an attribution breakdown showing **which markers are driving**
  each organ's trajectory (e.g. "kidney decline driven mainly by glucose &
  systolic"), reflecting the `sensitivity` weights in `physiology.ts`; roadmap
  organs (eyes, nerves) shown when available.
- **Primary actions.** Select organ; change period; expand the marker-attribution
  breakdown; correlate against the AGP/marker view; include the chart in a
  patient-facing education message or a summary (labelled as educational).
- **States.** Simulation-active; insufficient logging (sparse trend with a
  caveat); roadmap-organ placeholder.
- **Framing requirement.** The entire view sits inside a persistent **"Educational
  simulation — not a clinical measurement"** frame and uses a distinct visual
  treatment (e.g. dashed axis, watermark) so it cannot be confused with measured
  data. See [§9](#9-clinical-safety-liability--audit), FR-DOC-031.
- **FHIR.** Simulation outputs stored as clearly-typed `Observation`s under a
  Diabetes-Quest-specific `category`/`code` (e.g. `educational-organ-health`),
  never mixed into standard lab/vital categories; `Provenance` records that the
  source is the simulation engine, not a device.

### 6.6 Decision support & alerts

- **Purpose.** Surface clinician-aid cues that help the team find what matters,
  without making decisions for them.
- **Key data shown.** Active alerts for the patient with severity, the **rule
  that fired**, the data window that triggered it, and recommended-*consideration*
  text (never a directive). Categories: glycaemic (hypo/hyper, low-TIR, high
  variability), data (missed sync, low CGM wear, missed logging), adherence
  (missed medication), and trend (sustained marker drift, organ-trajectory
  decline). See [§7](#7-decision-support-rules).
- **Primary actions.** Acknowledge; assign / escalate to a clinician; snooze with
  reason; resolve with a documented disposition; convert an alert into a message
  or note; tune thresholds (clinician/admin, where permitted).
- **States.** New / unacknowledged; acknowledged; in-progress; resolved; snoozed;
  expired. Every transition is audited.
- **Framing requirement.** Each alert card carries the label **"Clinical decision
  support — requires clinician review. Not a diagnosis."**
- **FHIR.** `DetectedIssue` (the fired rule + evidence), `Flag` (active state on
  roster), `Communication` / `Task` (escalation, follow-up), `Provenance`.

### 6.7 Secure messaging with patients

- **Purpose.** Asynchronous, auditable, two-way clinical communication.
- **Key data shown.** Threaded conversation, sender / role, timestamps, delivery
  / read status, attachments (charts, education content), and quick-reply
  templates. Patient-facing messages appear in the Android app inbox
  (`02-android-app-prd.md`).
- **Primary actions.** Compose; insert a chart or education snippet; use a
  template; flag urgent; mark handled; escalate to a different team member.
- **States.** Draft; sent; delivered; read; failed; thread closed. **Messaging is
  explicitly not for emergencies** — a persistent banner directs patients to
  emergency services for acute symptoms.
- **FHIR.** `Communication` (and `CommunicationRequest` for clinician-initiated
  outreach), referencing `Patient`, `Practitioner`, `Encounter` where applicable.

### 6.8 Remote monitoring & alert triage

- **Purpose.** The operational "inbox" that lets one nurse/coordinator safely
  watch a panel of hundreds — find today's at-risk patients fast.
- **Key data shown.** A prioritised, cross-patient alert queue (severity-sorted),
  with patient, rule, age of alert, current owner, and SLA/age indicators;
  filters by team, severity, type, and ownership; counters (open / overdue /
  resolved-today).
- **Primary actions.** Claim / assign; bulk-acknowledge informational alerts;
  escalate; open patient in context; document disposition; configure routing
  rules (admin).
- **States.** Empty (all clear); normal; backlog/overdue (visual emphasis);
  filtered views; per-alert lifecycle as in §6.6.
- **FHIR.** `Flag`, `DetectedIssue`, `Task` (triage assignment & SLA tracking),
  `CareTeam`, `Communication`.

### 6.9 Clinical summaries & reports

- **Purpose.** Produce a clinician-readable, shareable, exportable summary of a
  period of care.
- **Key data shown.** Header (patient, period, author, generated-at); AGP &
  metrics; marker trends; medication & adherence summary; alert history &
  dispositions; the educational organ-health summary (clearly labelled);
  clinician narrative / assessment field.
- **Primary actions.** Generate for a chosen period; edit the narrative; preview;
  **export PDF**; **export CSV** (raw metrics); push to the EHR as a FHIR
  document; sign / attest.
- **States.** Draft; generated; edited; finalised/signed; exported. Finalised
  reports are immutable and versioned.
- **FHIR.** `DiagnosticReport` (the structured summary), `DocumentReference`
  (the rendered PDF), referencing the underlying `Observation`s / `MedicationStatement`s;
  `Provenance` for authorship & signing. See [§10](#10-reporting--export).

### 6.10 Population management & risk stratification

- **Purpose.** Manage the whole panel: see distribution of risk, target outreach,
  and ensure no flagged patient is missed.
- **Key data shown.** Panel-level metrics (mean TIR, % patients at target,
  alert load, engagement), **risk tiers** (e.g. high / moderate / low) with
  counts and trend, cohort filters (condition, last sync, adherence band,
  unmanaged alerts), and outreach status per cohort.
- **Primary actions.** Define / apply cohort filters; drill into a tier's patient
  list; launch outreach (templated messaging); assign cohorts to team members;
  export a population report; tune stratification thresholds (admin/clinician).
- **States.** Loading; populated; empty panel; cohort-filtered; threshold-edit
  mode.
- **Framing requirement.** Risk tiers are **operational prioritisation aids**, not
  clinical risk diagnoses, and are labelled as such.
- **FHIR.** Aggregated `Observation` / `MeasureReport` (panel metrics &
  stratification), `Group` (cohorts), `RiskAssessment` (per-patient tier, framed
  as decision support), `CareTeam`, `Task`.

---

## 7. Decision-support rules

> **All rules below are clinician-aid cues. They surface patterns and prompt
> human review. They do not diagnose, do not prescribe, and do not act
> autonomously.** Thresholds reflect widely-used consensus targets and are
> configurable per organisation; the educational simulation's healthy bands come
> from `physiology.ts`.

| ID | Rule (default) | Trigger / window | Severity | Surfaced as |
|----|----------------|------------------|----------|-------------|
| DS-01 | **Low Time-in-Range** | TIR (70–180 mg/dL clinical target) < 70% over 14 d | Moderate | `DetectedIssue` + roster flag |
| DS-02 | **Hyperglycaemia pattern** | Recurring readings > 250 mg/dL, or TAR-very-high > 5% over 14 d | Moderate | Alert |
| DS-03 | **Hypoglycaemia event** | Any reading < 54 mg/dL (level-2), or > 1% time < 70 mg/dL | **High** | Alert + priority triage |
| DS-04 | **High glycaemic variability** | CV% > 36% over 14 d | Moderate | Alert |
| DS-05 | **Missed / stale data** | No glucose sync for > 24 h (device patients) | Low–Moderate | Alert + "stale" roster state |
| DS-06 | **Low CGM wear** | CGM active time < 70% of period | Low | Data-quality flag on AGP |
| DS-07 | **Missed medication** | Scheduled dose unlogged/un-administered beyond grace window | Moderate | Adherence alert |
| DS-08 | **Disengagement** | No app activity for > 7 d | Low | Adherence alert (nurse outreach) |
| DS-09 | **Sustained marker drift** | Systolic / LDL trending out-of-band over ≥ 30 d | Moderate | Trend alert |
| DS-10 | **Educational organ-trajectory decline** | Simulated heart/kidney health falling across period | Low | Educational cue (clearly labelled, never clinical) |

Notes:

- DS-03 is the only **High**-severity rule by default because hypoglycaemia is
  the acute safety risk; it is routed to priority triage ([§6.8](#68-remote-monitoring--alert-triage)).
- DS-10 uses the **simulation** output and is explicitly framed as educational —
  it must never be presented with the same weight as DS-01…DS-09 clinical cues.
- The patient app's clinical thresholds (70–180 mg/dL TIR) and the simulation's
  educational bands (80–140 mg/dL in `physiology.ts`) are **intentionally
  different audiences**; the panel labels which is which and never conflates them.
- All thresholds are stored as org-level configuration, are versioned, and every
  change is audited.

---

## 8. Functional requirements

Each requirement has a stable ID and acceptance criteria (**AC**). "The system"
means the clinician panel together with its backend services.

### 8.1 Authentication & session (FR-DOC-001 … 005)

- **FR-DOC-001 — OIDC sign-in.** The system shall authenticate clinicians via
  OAuth2/OIDC Authorization Code + PKCE.
  *AC:* a valid IdP login yields a short-lived access token bound to a
  `Practitioner` identity; invalid credentials are rejected without leaking
  whether the account exists.
- **FR-DOC-002 — Mandatory MFA.** The system shall require MFA for every role on
  every new session.
  *AC:* no session reaches an authenticated screen without a passed MFA challenge;
  MFA method and result are recorded in the audit log.
- **FR-DOC-003 — Idle & absolute timeout.** The system shall auto-terminate
  sessions after a configurable idle period (default 15 min) and absolute
  lifetime.
  *AC:* after the idle period the session is invalidated and re-auth is required;
  a warning is shown before expiry.
- **FR-DOC-004 — Sign-out everywhere.** The system shall let a clinician end the
  current session and invalidate refresh tokens.
  *AC:* after sign-out, the prior token cannot access any API.
- **FR-DOC-005 — Last-login visibility.** The system shall show each clinician
  their last successful and last failed login.
  *AC:* both timestamps render on the post-login landing.

### 8.2 Access control & consent (FR-DOC-006 … 011)

- **FR-DOC-006 — Role-based access.** The system shall enforce the role matrix in
  [§4.1](#41-roles).
  *AC:* an `admin` cannot open any patient clinical screen; a `care coordinator`
  cannot read clinician free-text notes; attempts are denied and audited.
- **FR-DOC-007 — Consent-gated data.** The system shall return patient data only
  when an active `Consent` links the requesting clinician to that patient within
  the consented scope.
  *AC:* with no/expired consent, the API returns no clinical data and the patient
  shows "Access ended"; out-of-scope data is filtered server-side.
- **FR-DOC-008 — Immediate revocation.** The system shall revoke access within the
  freshness window when a patient revokes consent.
  *AC:* after revocation, the next request fails authorisation and open detail
  views lock; the event is audited.
- **FR-DOC-009 — Scope honouring.** The system shall respect partial consent
  scopes (e.g. glucose-only).
  *AC:* lanes/screens outside scope are hidden and their data never transmitted.
- **FR-DOC-010 — Care-team membership.** The system shall additionally require
  `CareTeam` membership for roster visibility.
  *AC:* a consented-but-unassigned clinician does not see the patient in their
  default roster.
- **FR-DOC-011 — Minimum-necessary enforcement.** The system shall apply
  minimum-necessary filtering per role and scope at the API layer, not only the UI.
  *AC:* direct API calls cannot retrieve data the UI hides for that role/scope.

### 8.3 Roster, timeline & trends (FR-DOC-012 … 020)

- **FR-DOC-012 — Urgency-sorted roster.** The system shall sort the roster by
  unresolved alert severity by default and support filtering.
  *AC:* the highest-severity unresolved patient appears first; filters narrow the
  list without losing alert badges.
- **FR-DOC-013 — Unified timeline.** The system shall render a merged
  chronological timeline of clinical, behavioural, medication, message, alert, and
  goal events.
  *AC:* events from all sources appear on one axis with correct timestamps and
  source attribution; time-range and type filters work.
- **FR-DOC-014 — AGP visualisation.** The system shall render an AGP-style modal-day
  glucose profile with median, IQR, 10–90% bands, and shaded target range.
  *AC:* for a period with sufficient data the AGP renders with correct percentile
  curves; the target band is shaded.
- **FR-DOC-015 — Glycaemic metrics.** The system shall compute and display TIR,
  TAR (high/very-high), TBR (low/very-low), GMI, mean glucose, and CV%.
  *AC:* metrics match the underlying data for the selected period within rounding;
  units and reference targets are shown.
- **FR-DOC-016 — Data-sufficiency guard.** The system shall suppress the AGP and
  show an explicit insufficiency message when data coverage is below the
  reliability threshold.
  *AC:* below threshold, no AGP curve is drawn; a clear message explains why.
- **FR-DOC-017 — Companion marker trends.** The system shall plot systolic BP,
  hydration, and LDL trends with healthy bands shaded per `physiology.ts`.
  *AC:* each marker shows its band and in/out-of-range state for the period.
- **FR-DOC-018 — Organ-health trend.** The system shall plot heart and kidney
  health over time with qualitative bands and marker attribution.
  *AC:* trends and the driving-marker breakdown reflect the simulation outputs and
  `sensitivity` weights; roadmap organs appear when available.
- **FR-DOC-019 — Educational framing of simulation.** The system shall render all
  simulation-derived content inside a persistent "Educational simulation — not a
  clinical measurement" frame, visually distinct from clinical data.
  *AC:* simulation views carry the label and a distinct visual treatment; no
  simulation series is co-plotted on a clinical lab/vital axis.
- **FR-DOC-020 — Period controls.** The system shall support 24 h, 7/14/30/90 d,
  and custom ranges across timeline and trend views.
  *AC:* changing the period updates every dependent chart and metric consistently.

### 8.4 Decision support & alerts (FR-DOC-021 … 026)

- **FR-DOC-021 — Rule engine.** The system shall evaluate the rules in
  [§7](#7-decision-support-rules) and raise alerts with severity, fired-rule, and
  triggering evidence.
  *AC:* given data meeting a rule's condition, the corresponding alert appears with
  correct severity and an evidence window.
- **FR-DOC-022 — Non-diagnostic labelling.** The system shall label every alert as
  decision support requiring clinician review and never present diagnoses or
  prescriptions.
  *AC:* every alert card shows the non-diagnostic label; no UI text issues a
  diagnosis or dosing instruction.
- **FR-DOC-023 — Hypoglycaemia priority.** The system shall route level-2
  hypoglycaemia (DS-03) to priority triage.
  *AC:* a < 54 mg/dL event creates a High alert at the top of the triage queue.
- **FR-DOC-024 — Alert lifecycle.** The system shall support acknowledge, assign,
  escalate, snooze (with reason), and resolve (with disposition), auditing each
  transition.
  *AC:* each transition persists, updates the queue/roster, and writes an audit
  entry with actor, time, and reason.
- **FR-DOC-025 — Configurable thresholds.** The system shall allow authorised roles
  to configure rule thresholds at org level, versioned and audited.
  *AC:* a threshold change applies to subsequent evaluations and is recorded with
  before/after values and author.
- **FR-DOC-026 — Triage queue.** The system shall provide a cross-patient,
  severity-sorted triage queue with ownership and SLA/age indicators.
  *AC:* alerts across consented patients appear in one queue; claiming/assigning
  updates ownership; overdue alerts are visually emphasised.

### 8.5 Messaging (FR-DOC-027 … 029)

- **FR-DOC-027 — Secure two-way messaging.** The system shall provide threaded,
  auditable messaging between clinicians and patients, delivered to the app inbox.
  *AC:* a sent message appears in the patient app; replies appear in the thread;
  all messages are stored as `Communication` and audited.
- **FR-DOC-028 — Templates & attachments.** The system shall support quick-reply
  templates and attachment of charts / education content.
  *AC:* a clinician can insert a template and attach an AGP/organ chart; the patient
  receives both.
- **FR-DOC-029 — Non-emergency notice.** The system shall persistently indicate that
  messaging is not for emergencies.
  *AC:* the emergency-services notice is visible in every thread on both sides.

### 8.6 Reporting & population (FR-DOC-030 … 037)

- **FR-DOC-030 — Clinical summary generation.** The system shall generate a
  period clinical summary including AGP, metrics, marker trends, medication/adherence,
  alert history, an educational organ summary, and a clinician narrative.
  *AC:* generating a summary for a period produces all sections populated from that
  period's data.
- **FR-DOC-031 — Report safety labelling.** The system shall label educational
  simulation content within reports and keep it visually separated from clinical
  data.
  *AC:* exported reports show the educational label on organ-health content and do
  not intermix it with clinical metrics.
- **FR-DOC-032 — PDF export.** The system shall export a finalised summary as PDF
  stored as a `DocumentReference`.
  *AC:* the PDF renders all sections, is immutable once finalised, and is versioned.
- **FR-DOC-033 — CSV export.** The system shall export raw period metrics as CSV.
  *AC:* the CSV contains the metric values matching the on-screen summary.
- **FR-DOC-034 — FHIR document publication.** The system shall publish the summary
  as a FHIR `DiagnosticReport` referencing source observations.
  *AC:* the `DiagnosticReport` validates against R4 and references the underlying
  resources.
- **FR-DOC-035 — Report attestation.** The system shall let an authorised clinician
  sign/attest a report, recording authorship in `Provenance`.
  *AC:* a signed report records signer identity and time; admins and coordinators
  cannot sign.
- **FR-DOC-036 — Risk stratification.** The system shall stratify the panel into
  configurable risk tiers and display counts and trends, labelled as operational
  prioritisation.
  *AC:* patients are assigned tiers per configured thresholds; tier counts and
  trend render; the operational-aid label is shown.
- **FR-DOC-037 — Cohort outreach.** The system shall let authorised roles filter a
  cohort and launch templated outreach.
  *AC:* applying a filter yields the matching patient set; outreach sends templated
  `Communication`s to the cohort and records the campaign.

### 8.7 Audit & safety (FR-DOC-038 … 040)

- **FR-DOC-038 — Comprehensive access audit.** The system shall record an
  immutable audit entry for every access to and action on patient data.
  *AC:* viewing a patient, opening a chart, exporting a report, or messaging each
  produces an `AuditEvent` with actor, patient, action, time, and source.
- **FR-DOC-039 — Audit review (admin).** The system shall let admins search and
  review the audit log without exposing clinical free-text beyond what is necessary.
  *AC:* admins can query audit by actor/patient/time; entries are read-only and
  exportable.
- **FR-DOC-040 — AI escalation, never autonomy.** The system shall ensure any
  AI-generated summary or flag is presented as a suggestion for clinician review and
  escalates to a human; it shall never finalise a diagnosis, prescription, or report
  autonomously.
  *AC:* AI output is labelled as draft/suggestion, requires clinician action to
  persist into a signed artefact, and is traceable to its model version via
  `Provenance` (see `06-ai-system.md`).

---

## 9. Clinical safety, liability & audit

### 9.1 Safety framing

- **Decision support, not decision making.** Every cue, alert, score, and AI
  output is a **clinician aid**. The panel never diagnoses, never prescribes, and
  never instructs dosing. This is enforced in copy (FR-DOC-022), in AI behaviour
  (FR-DOC-040), and architecturally — the panel has no pathway that converts a
  suggestion into a clinical action without a human clinician's explicit, attested
  step.
- **Simulation vs. clinical truth.** The educational organ-impact model
  (`physiology.ts`) is **directionally faithful, not predictive**. The panel keeps
  it in a labelled, visually-distinct frame (FR-DOC-019, FR-DOC-031) so a clinician
  never mistakes a simulated "Strained kidney" score for measured nephropathy.
- **Acute-risk routing.** Hypoglycaemia (DS-03) is the prioritised safety path;
  messaging is explicitly non-emergency (FR-DOC-029).
- **Human-in-the-loop AI.** Consistent with the suite anchor, the AI layer
  summarises and flags and escalates to clinicians; it acts only as a drafting and
  triage aid (`06-ai-system.md`).

### 9.2 Liability posture

- The panel is positioned as a **clinical decision-support tool used under the
  professional judgement of a licensed clinician**, who remains responsible for all
  clinical decisions. Regulatory classification (e.g. SaMD risk class) is determined
  in `08-security-compliance.md`; this volume's design choices (non-diagnostic
  framing, mandatory human attestation, audit) support the lowest-risk posture
  consistent with the feature set.
- Clinical content, thresholds, and the simulation must pass **clinician review**
  before any real-world use, per the `DESIGN.md` roadmap and `README.md` disclaimer.

### 9.3 Audit of clinician access

- **Every** clinician interaction with patient data is audited as a FHIR
  `AuditEvent`: authentication, patient open, chart view, report generation/export,
  message send, alert disposition, consent-driven access denials, and threshold
  changes (FR-DOC-038).
- Audit entries are **immutable, time-synchronised, and tamper-evident**; retention
  and integrity controls are defined in `08-security-compliance.md`.
- Audit is reviewable by admins (FR-DOC-039) and supports breach investigation and
  GDPR/HIPAA accounting-of-disclosures obligations.

---

## 10. Reporting & export

| Output | Format | FHIR representation | Notes |
|--------|--------|---------------------|-------|
| Clinical period summary | PDF | `DocumentReference` (rendered) + `DiagnosticReport` (structured) | Immutable & versioned once finalised; attestable (FR-DOC-035) |
| Raw metrics | CSV | — (derived from `Observation`s) | TIR/TAR/TBR/GMI/CV% and marker series for the period |
| Chart export | SVG / PNG | embedded in document | AGP, marker, organ charts; organ charts carry educational label |
| Population report | PDF / CSV | `MeasureReport` | Panel metrics, tier distribution, outreach status |
| EHR publication | FHIR | `DiagnosticReport` / `DocumentReference` | Pushed to the EHR of record via the backend (`04-backend.md`) |

- Reports separate **clinical** content from **educational simulation** content
  (FR-DOC-031). Organ-health summaries are always labelled.
- Exports are themselves audited disclosures (FR-DOC-038).
- PDF/CSV/FHIR exports honour the requesting clinician's consent scope — a report
  cannot contain data the clinician was not entitled to view.

---

## 11. Non-functional requirements

| Category | Requirement |
|----------|-------------|
| **Data freshness** | Device/patient data ingested via the backend shall be reflected in the panel within **≤ 5 minutes** of backend availability; the timeline/roster shows last-sync time and a "stale" state when data is older than the DS-05 window. |
| **Alert latency** | Once triggering data is ingested, a corresponding decision-support alert shall appear in the triage queue/roster within **≤ 60 seconds** (priority hypoglycaemia DS-03 prioritised). |
| **Performance** | Roster and patient overview shall reach interactive state in **≤ 2 s** (p95) for a panel of up to 500 patients on a desktop connection; AGP/trend charts render in **≤ 1 s** (p95) after data load. |
| **Concurrency** | The panel shall support at least **200 concurrent clinicians per organisation** without degradation of the latency targets; messaging and alert state remain consistent across concurrent sessions. |
| **Scalability** | Population dashboard and stratification shall operate over panels of **≥ 10,000 patients** at the organisation level using server-side aggregation (`MeasureReport`), not client-side computation. |
| **Availability** | Target **99.9%** monthly availability for the panel; graceful degradation (read-only/cached) when downstream services are impaired. |
| **Accessibility** | The panel shall conform to **WCAG 2.1 AA**: full keyboard operability, visible focus, semantic structure / ARIA for charts and tables, **non-colour-redundant** encoding of status (status colours from `physiology.ts` always paired with text/shape so red/amber/green is never the only signal), text resizing to 200%, and screen-reader-accessible AGP/organ data (tabular alternative). |
| **Internationalisation** | Localisable copy, units (mg/dL ↔ mmol/L), date/number formats; aligns with the localisation roadmap in `DESIGN.md`. |
| **Security** | TLS 1.2+ in transit, encryption at rest, OWASP-aligned web hardening; conforms to OWASP ASVS for the web app and the broader controls in `08-security-compliance.md`. |
| **Browser support** | Current and previous major versions of evergreen desktop browsers; no dependence on deprecated APIs. |
| **Auditability** | All access/actions auditable (FR-DOC-038) with synchronised, tamper-evident timestamps. |

---

## 12. FHIR resource map

The panel's data contract is **HL7 FHIR R4**. Principal resources by area:

| Area | Primary FHIR resources |
|------|------------------------|
| Identity & roles | `Practitioner`, `PractitionerRole`, `Organization` |
| Patient & care team | `Patient`, `CareTeam`, `RelatedPerson` |
| Consent | `Consent` |
| Clinical measurements | `Observation` (glucose/CGM, BP, weight, hydration proxy, LDL & other labs), `Device`, `DeviceMetric` |
| Educational simulation | `Observation` with Diabetes-Quest `category=educational-organ-health` (heart/kidney scores, marker simulation), `Provenance` (source = simulation engine) |
| Logged behaviour | `Observation` (activity/exercise), `NutritionIntake`/`Observation` (meals) |
| Medication & adherence | `MedicationStatement`, `MedicationAdministration`, `MedicationRequest` (reference only) |
| Decision support | `DetectedIssue`, `Flag`, `RiskAssessment`, `Task` |
| Goals & plan | `CarePlan`, `Goal` |
| Messaging | `Communication`, `CommunicationRequest` |
| Reporting | `DiagnosticReport`, `DocumentReference`, `MeasureReport` |
| Cohorts | `Group` |
| Provenance & audit | `Provenance`, `AuditEvent` |

Derived glycaemic metrics (TIR/TAR/TBR/GMI/CV%) are surfaced as computed
`Observation`s and/or within `DiagnosticReport`. Simulation outputs are **never**
filed under standard vital-sign/lab categories. Detailed profiles, terminologies,
and the canonical server are defined in `04-backend.md`.

---

## 13. Traceability & cross-references

This volume is part of the ten-volume Diabetes Quest Specification Suite and is
designed to be read alongside its siblings.

| Volume | File | Relationship to this volume |
|--------|------|-----------------------------|
| 01 | [`01-product-vision.md`](01-product-vision.md) | Product vision, differentiator (organ-impact visualisation), and educational-only positioning that frames the panel |
| 02 | [`02-android-app-prd.md`](02-android-app-prd.md) | Patient app PRD — the other side of the shared data model; consent grant, message inbox, goals, and logging originate here |
| 04 | [`04-backend.md`](04-backend.md) | FHIR API, consent enforcement, aggregation/`MeasureReport`, EHR publication, server-side minimum-necessary filtering the panel depends on |
| 05 | [`05-medical-devices.md`](05-medical-devices.md) | CGM / BP / scale integration that supplies the clinical observations behind AGP and trends |
| 06 | [`06-ai-system.md`](06-ai-system.md) | AI summarisation and flagging behaviour — human-in-the-loop, never diagnoses/prescribes, escalates to clinicians (FR-DOC-040) |
| 07 | [`07-uiux-design-system.md`](07-uiux-design-system.md) | Shared Material Design 3 tokens, organ/marker status palettes, and web components consumed by the panel |
| 08 | [`08-security-compliance.md`](08-security-compliance.md) | OAuth2/OIDC, MFA, HIPAA/GDPR/ISO 27001, audit integrity & retention, SaMD classification, OWASP hardening |
| 09 | [`09-qa-testing.md`](09-qa-testing.md) | Verification of the FR-DOC requirements and acceptance criteria, accessibility and safety testing |
| 10 | [`10-claude-code-build-playbook.md`](10-claude-code-build-playbook.md) | Build playbook for implementing the panel against this specification |

**Consistency anchors honoured:** Android-first patient app with a **web**
clinician panel; **organ-impact visualisation** as the differentiator (§6.5);
Material Design 3 web adaptation (§3.2); HL7 FHIR R4 (§12); OAuth2/OIDC and
HIPAA/GDPR/ISO 27001 (§4, §9, §11); OWASP-aligned web hardening; and the
inviolable rule that **AI never diagnoses or prescribes and always escalates to
human clinicians** (§7, §8.4, §9, FR-DOC-040).
