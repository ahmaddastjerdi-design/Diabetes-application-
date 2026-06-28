# Diabetes Quest — Volume 7: UI/UX Design System

_Part of the Diabetes Quest Specification Suite — Volume 7 of 10._

**Abstract.** This volume defines the **Diabetes Quest Design System** — the single, versioned source of truth for how every surface of the platform looks, behaves, and communicates. It spans the **Android-first React Native (Expo) patient app** and the **web clinician panel**, both built on a shared, **Material Design 3 (M3)** foundation. The system formalizes and extends the design tokens already present in the prototype's `src/theme.ts` (the `#2563eb` primary, the `#16a34a` / `#d97706` / `#dc2626` clinical-status triad, the 4px spacing unit, the radius and elevation scales) into a complete, accessible, themeable token set with light and dark modes, dual-platform delivery, and a catalogued component library. Its guiding posture is **clarity over decoration, calm over alarm, motivation without manipulation, and accessibility-first** — with the non-negotiable rule that **color is never the sole carrier of clinical meaning**. The signature interaction — the **organ-impact "ripple"** — and the data-visualization language for markers, AGP-style glucose, and organ-health gauges are specified here in full, along with WCAG 2.1 AA conformance targets, dark-mode and RTL requirements, internationalization (including mg/dL ↔ mmol/L), and the mapping from tokens to `theme.ts` and to the web app. It closes with stable, testable design requirements (`DS-001 …`).

> **Educational-only today.** Visual treatments in this volume — organ health, marker bands, status colors — render an intentionally simplified teaching simulation (Volume 1, Volume 6). No UI element may be presented as a clinical measurement, diagnosis, or prediction of an individual's health. Regulated-data presentations (real CGM/BGM/BP values via Volume 5) inherit the same accessibility and clinical-clarity rules and add the safety labelling defined in Volumes 6 and 8.

---

## Table of contents

1. [Purpose, scope & how to use this volume](#1-purpose-scope--how-to-use-this-volume)
2. [Design principles](#2-design-principles)
3. [Material Design 3 foundation](#3-material-design-3-foundation)
4. [Color system & semantic roles](#4-color-system--semantic-roles)
5. [Design tokens (complete reference)](#5-design-tokens-complete-reference)
6. [Typography](#6-typography)
7. [Spacing, grid & layout](#7-spacing-grid--layout)
8. [Elevation, corner radius & iconography](#8-elevation-corner-radius--iconography)
9. [Illustration & organ visual language](#9-illustration--organ-visual-language)
10. [Component library](#10-component-library)
11. [Data-visualization guidelines](#11-data-visualization-guidelines)
12. [Accessibility specification](#12-accessibility-specification)
13. [Dark mode & RTL](#13-dark-mode--rtl)
14. [Motion & animation](#14-motion--animation)
15. [Localization & internationalization](#15-localization--internationalization)
16. [Token delivery: theme.ts & web mapping](#16-token-delivery-themets--web-mapping)
17. [Design requirements (DS-001 …)](#17-design-requirements-ds-001-)
18. [Traceability & cross-references](#18-traceability--cross-references)

---

## 1. Purpose, scope & how to use this volume

### 1.1 Purpose

The design system exists so that a patient screen built today and a clinician screen built next quarter feel like one product, meet the same accessibility bar, and can be re-themed (dark mode, high contrast, locale) without per-screen rework. It is **prescriptive**: where it states a token name, value, minimum, or acceptance criterion, that is the contract. Where it offers guidance ("prefer…"), deviation is permitted with a recorded rationale.

### 1.2 Scope

| In scope | Out of scope (owning volume) |
|---|---|
| Visual language, tokens, components, motion, a11y, i18n of UI | Information architecture / flows of the patient app (Volume 2) |
| Cross-platform M3 application (Android RN + web) | Clinician-panel feature logic and roles (Volume 3) |
| Data-viz visual encoding rules | Data contracts feeding charts (Volume 4) |
| Status/labelling presentation of device & AI data | Device protocols (Volume 5), AI safety copy rules (Volume 6) |
| WCAG targets and design-time a11y | Automated a11y test execution (Volume 9) |

### 1.3 How to use it

- **Designers** consume sections 2–14 and the token reference (§5); produce Figma artifacts whose styles map 1:1 to token names.
- **Engineers** consume §5, §10, §16; import tokens, never hard-code hex/spacing.
- **QA** (Volume 9) consumes §12 and §17 as the source of acceptance criteria.

### 1.4 Versioning

The design system is semver-versioned (`design-system@MAJOR.MINOR.PATCH`). A token rename or removal, or a contrast/behavior change that breaks a component contract, is **MAJOR**. Additive tokens/components are **MINOR**. Value tweaks within contract (e.g., a non-status color nudge that keeps contrast) are **PATCH**. This volume documents **`design-system@1.0`**.

---

## 2. Design principles

Five principles, in priority order. When they conflict, the higher one wins.

### P1 — Clinical clarity first
Every screen must answer "what is true, and what (if anything) should I do?" before it entertains. Numbers are legible at a glance; status is unambiguous; the most important element on a screen is the most visually prominent. Ambiguity is a defect, not a style choice.

### P2 — Calm, non-alarming tone
Diabetes is a lifelong, self-managed condition; the UI is a daily companion, not an emergency dashboard. We use **desaturated, low-arousal surfaces**, generous whitespace, and **restrained** use of red. "Out of range" is communicated as information to act on, never as a klaxon. Critical-status red (`#dc2626`) is reserved and is always paired with a concrete, non-shaming next step. There are **no** flashing elements, no countdown-timer urgency, no loss-aversion dark patterns.

### P3 — Motivation without manipulation (SDT)
The gamification layer (XP, levels, badges, *forgiving* streak) serves Self-Determination Theory's autonomy, competence, and relatedness — not engagement-at-any-cost. We **celebrate progress** (competence) and **never punish** lapses: the streak has a grace day, missed days are neutral, and we never use guilt, fake scarcity, manipulative notifications, or infinite-scroll/variable-reward traps. Rewards are honest and earned.

### P4 — Accessibility-first
Accessibility is a design input, not a remediation pass. Color is **never** the only signal for clinical status (P1 + P4 are the load-bearing pair). Every interactive element has an accessible name, meets the touch-target minimum, and is reachable by screen reader and external keyboard. Dynamic type, reduced motion, and high contrast are first-class.

### P5 — One system, two platforms
Patient (Android) and clinician (web) share tokens, semantics, and component contracts. Platform-idiomatic rendering is allowed (M3 ripple on Android; focus-ring affordances on web), but a "status pill" means the same thing, looks like the same family, and carries the same a11y semantics on both.

---

## 3. Material Design 3 foundation

### 3.1 Why M3

Material Design 3 gives us a mature, accessible, tokenized system with first-party support on Android and a documented web story, plus dynamic-color theming and a color-role model that maps cleanly onto our calm-clinical palette. We adopt **M3 color roles, type roles, elevation, shape, and state-layer** concepts; we **constrain** M3 where its defaults are too playful or too dense for clinical content.

### 3.2 Application matrix

| M3 concept | Patient app (Android, RN/Expo) | Clinician panel (web) |
|---|---|---|
| Color roles (primary, surface, on-*) | Mapped to `theme.ts` tokens (§16) | Mapped to CSS custom properties (§16) |
| Components | `react-native-paper` (M3 mode) + bespoke components | M3 web components / MUI-with-M3-theme + bespoke |
| Elevation | Tonal + shadow (RN `elevation` + shadow tokens) | Tonal surface + box-shadow tokens |
| State layers (hover/press/focus) | Press ripple + opacity overlay | Hover/focus/press overlays + visible focus ring |
| Shape (corner radius) | `radius` token scale | Same scale via CSS vars |
| Dynamic color (Material You) | **Optional**, opt-in; never overrides clinical-status colors | Not used; fixed brand theme |

> **Constraint — clinical colors are immune to dynamic color.** If Material You dynamic theming is enabled on a patient device, it may retint *neutral/brand* surfaces only. The status triad (in-range/borderline/out-of-range/critical) and organ-gauge colors are **fixed** and never derived from wallpaper, so clinical meaning is stable across devices.

### 3.3 Density & touch

The patient app uses **comfortable** density (large targets, one-handed reach). The clinician panel supports a **compact** density mode for data-dense tables while preserving minimum target sizes (§12). Density is a token set (`density.comfortable` / `density.compact`), not ad-hoc spacing.

---

## 4. Color system & semantic roles

### 4.1 Source of truth & strategy

The palette is **grounded in the prototype** and extended. The existing `theme.ts` and `physiology.ts` already define the load-bearing colors; we keep their hex values exactly where they carry meaning (so the running app and the spec never diverge) and add the roles, tints, on-colors, and dark-mode pairs M3 requires.

Two color families:

1. **Brand/neutral family** — primary, surface, text, border. Themeable; may be tonally adjusted for dark/high-contrast.
2. **Clinical-status family** — in-range/borderline/out-of-range/critical and the organ-gauge ramp. **Semantically fixed**; identical light/dark hue, with only on-color and tint adjusted for contrast. Never overridden by dynamic color.

### 4.2 Semantic status roles (the clinical triad + critical)

Mapped directly to the values already used by `markerStatus()` and `organStatus()` in `physiology.ts`:

| Semantic role | Hex (fixed) | Source in code | Meaning | Mandatory non-color signal |
|---|---|---|---|---|
| `status.inRange` | `#16a34a` | `markerStatus` "In range", `organStatus` "Thriving" | Marker within healthy band / organ thriving | ✓ icon (check) + label text |
| `status.borderline` | `#d97706` | `markerStatus` "Borderline", `organStatus` "Strained" | Just outside band; nudge, not alarm | ▲ icon (triangle) + label text |
| `status.outOfRange` | `#dc2626` | `markerStatus` "Out of range" | Clearly outside band | ■/✕ icon + label text |
| `status.critical` | `#dc2626` | `organStatus` "Critical" (score < 20) | Organ critically low (simulation) | ✕ icon + label text + supportive CTA |
| `status.atRisk` | `#ea580c` | `organStatus` "At risk" (score 20–39) | Organ at risk | ▲ icon + label text |
| `status.healthy` | `#65a30d` | `organStatus` "Healthy" (score 60–79) | Organ healthy (below thriving) | ✓ icon + label text |

> **Rule DS (non-color signal).** Every place a status color appears, an **independent** redundant encoding (icon **shape** + text **label**, and where space-constrained at least one of the two) must appear. A status pill is never a bare colored dot. This satisfies WCAG 1.4.1 (Use of Color) and is the design embodiment of P1+P4.

### 4.3 Brand & neutral roles

| Role | Light hex | Source | Usage |
|---|---|---|---|
| `primary` | `#2563eb` | `theme.colors.primary` | Primary actions, active states, links, key accents |
| `primaryPressed` | `#1d4ed8` | `theme.colors.primaryDark` | Pressed/active primary |
| `onPrimary` | `#ffffff` | (button text in `ui.tsx`) | Text/icon on primary |
| `background` | `#f5f8fc` | `theme.colors.bg` | App background |
| `surface` | `#ffffff` | `theme.colors.card` | Cards, sheets, surfaces |
| `onSurface` | `#0f172a` | `theme.colors.text` | Primary text |
| `onSurfaceVariant` | `#64748b` | `theme.colors.subtext` | Secondary text, captions, ranges |
| `outline` | `#e2e8f0` | `theme.colors.border` | Borders, dividers, track backgrounds |

### 4.4 Accent / domain roles

| Role | Hex | Source | Usage |
|---|---|---|---|
| `organ.heart` | `#ef4444` | `theme.colors.heart` | Heart identity (icon tint, chart series) — **identity, not status** |
| `organ.kidney` | `#8b5cf6` | `theme.colors.kidney` | Kidney identity |
| `xp` | `#f59e0b` | `theme.colors.xp` | XP / level / streak accent (gamification) |

> **Heart-red vs status-red.** `organ.heart` (`#ef4444`) is an **identity** color and is intentionally distinct in hue/value from `status.outOfRange` (`#dc2626`). To avoid confusing "this is the heart" with "the heart is in danger," organ *status* is always rendered via the status family + gauge ramp and a text label, never by tinting the organ glyph red.

### 4.5 Contrast requirements

All values are WCAG 2.1 contrast ratios against the surface they sit on.

| Pairing | Minimum ratio | Notes |
|---|---|---|
| Body text on surface | **4.5:1** (AA normal) | `onSurface` on `surface` |
| Large text (≥ 24px, or ≥ 18.66px bold) | **3:1** | Headlines, large numbers |
| `onSurfaceVariant` (captions) | **4.5:1** | Secondary text still meets AA |
| Status text/icon on its tint chip | **4.5:1** | Pill text uses full-strength hue on tinted bg |
| Non-text UI (borders, gauge tracks, focus ring, icons conveying meaning) | **3:1** (AA non-text 1.4.11) | Status icons, chart gridlines that carry meaning |
| Focus indicator vs adjacent colors | **3:1** | §12 |

> **Pill tint caveat.** `ui.tsx`'s `Pill` renders text at full hue on a 13%-alpha (`+"22"`) tint of the same hue. At that alpha the text-on-chip contrast is comfortable in light mode; the design system **mandates a contrast check per status color × theme** (a token-level test in Volume 9) and adjusts tint alpha for dark mode (§13) so the 4.5:1 floor always holds.

---

## 5. Design tokens (complete reference)

Tokens are the atomic, named, themeable values. Naming is `category.role[.state]`. Engineers consume tokens only; raw hex/px in components is a lint failure (§16, DS-018).

### 5.1 Color tokens — light theme (default)

| Token | Value | Usage |
|---|---|---|
| `color.primary` | `#2563eb` | Primary action / accent |
| `color.primary.pressed` | `#1d4ed8` | Primary pressed |
| `color.onPrimary` | `#ffffff` | Content on primary |
| `color.background` | `#f5f8fc` | App background |
| `color.surface` | `#ffffff` | Card/sheet surface |
| `color.surface.variant` | `#eef2f8` | Subtle raised/inset surface (derived) |
| `color.onSurface` | `#0f172a` | Primary text |
| `color.onSurface.variant` | `#64748b` | Secondary text |
| `color.outline` | `#e2e8f0` | Border / divider / track |
| `color.outline.strong` | `#cbd5e1` | Emphasized divider (derived) |
| `color.status.inRange` | `#16a34a` | In-range / thriving |
| `color.status.healthy` | `#65a30d` | Healthy (organ 60–79) |
| `color.status.borderline` | `#d97706` | Borderline / strained |
| `color.status.atRisk` | `#ea580c` | At risk (organ 20–39) |
| `color.status.outOfRange` | `#dc2626` | Out of range |
| `color.status.critical` | `#dc2626` | Critical (organ < 20) |
| `color.organ.heart` | `#ef4444` | Heart identity |
| `color.organ.kidney` | `#8b5cf6` | Kidney identity |
| `color.xp` | `#f59e0b` | XP / streak accent |
| `color.scrim` | `rgba(15,23,42,0.45)` | Dialog/sheet scrim |
| `color.focus` | `#2563eb` | Focus ring (≥3:1 vs neighbors) |

### 5.2 Color tokens — dark theme

Status hues are **preserved**; only on-color/tint/surface change. See §13 for the rule set.

| Token | Dark value | Note |
|---|---|---|
| `color.background` | `#0b1220` | Deep slate, low glare |
| `color.surface` | `#131c2e` | Elevated surface |
| `color.surface.variant` | `#1b2740` | Higher elevation |
| `color.onSurface` | `#e8eef7` | Primary text (≥ 4.5:1) |
| `color.onSurface.variant` | `#9fb0c7` | Secondary text (≥ 4.5:1) |
| `color.outline` | `#2a3852` | Border/divider |
| `color.primary` | `#7aa2f7` | Lightened for contrast on dark |
| `color.onPrimary` | `#0b1220` | Dark content on lightened primary |
| `color.status.inRange` | `#16a34a` (chip text `#4ade80`) | Hue fixed; chip text lightened for ≥4.5:1 |
| `color.status.borderline` | `#d97706` (chip text `#fbbf24`) | Hue fixed; chip text lightened |
| `color.status.outOfRange` | `#dc2626` (chip text `#f87171`) | Hue fixed; chip text lightened |
| `color.organ.heart` | `#f87171` | Identity, lightened |
| `color.organ.kidney` | `#a78bfa` | Identity, lightened |

### 5.3 Spacing tokens

Grounded in `theme.space(n) = n * 4` (4px base unit).

| Token | Value (px) | `space(n)` | Usage |
|---|---|---|---|
| `space.0` | 0 | — | reset |
| `space.1` | 4 | `space(1)` | hairline gaps |
| `space.2` | 8 | `space(2)` | tight inner gaps (pill→row) |
| `space.3` | 12 | `space(3)` | default intra-card gap |
| `space.4` | 16 | `space(4)` | card padding |
| `space.5` | 20 | `space(5)` | button horizontal padding |
| `space.6` | 24 | `space(6)` | section spacing |
| `space.8` | 32 | `space(8)` | screen gutters (large) |
| `space.10` | 40 | `space(10)` | hero spacing |

> The `space()` function accepts fractional `n` (the prototype uses `space(2.5)` and `space(3.5)`); these resolve to 10px and 14px and remain valid. Prefer integer steps; fractional steps are reserved for component-internal optical alignment.

### 5.4 Radius tokens

Grounded in `theme.radius`.

| Token | Value | Usage |
|---|---|---|
| `radius.sm` | 8 | inputs, small chips, inner elements |
| `radius.md` | 14 | buttons |
| `radius.lg` | 20 | cards, sheets |
| `radius.pill` | 999 | pills, badges, streak indicator |

### 5.5 Elevation / shadow tokens

Grounded in `theme.shadow` (level 2).

| Token | RN values | Web box-shadow | Usage |
|---|---|---|---|
| `elevation.0` | none | none | flat on background |
| `elevation.1` | `shadowOpacity .04, radius 8, offsetY 2, elevation 1` | `0 1px 4px rgba(15,23,42,.04)` | subtle raise (rows) |
| `elevation.2` | `shadowOpacity .06, radius 12, offsetY 4, elevation 2` | `0 4px 12px rgba(15,23,42,.06)` | **cards (matches `theme.shadow`)** |
| `elevation.3` | `shadowOpacity .10, radius 20, offsetY 8, elevation 6` | `0 8px 20px rgba(15,23,42,.10)` | sheets, dialogs, menus |

> Dark mode reduces shadow reliance and leans on **tonal elevation** (lighter `surface.variant`) since shadows read poorly on dark backgrounds.

### 5.6 Typography tokens — see §6. Motion tokens — see §14.4.

### 5.7 Token JSON shape (delivery contract)

Tokens ship as a platform-agnostic JSON (Style-Dictionary-compatible) that compiles to `theme.ts` (RN) and CSS custom properties (web). Example shape:

```json
{
  "color": { "primary": { "value": "#2563eb", "type": "color" } },
  "space": { "4": { "value": "16", "type": "dimension" } },
  "radius": { "lg": { "value": "20", "type": "dimension" } }
}
```

---

## 6. Typography

### 6.1 Type family

- **Patient app:** system default (`Roboto` on Android) for performance, native dynamic-type support, and no font-loading flash. An optional brand font may be loaded for the wordmark only.
- **Web panel:** system UI stack (`-apple-system, "Segoe UI", Roboto, sans-serif`) for consistency and zero CLS.
- Tabular figures (`font-variant-numeric: tabular-nums`) are **required** for all numeric values (marker values, glucose, scores) so digits don't jitter when they change.

### 6.2 Type scale

Aligned to M3 type roles and to the sizes already in the prototype (e.g., score `26/800`, organ title `17/700`, marker value `16/800`, caption `11`).

| Token | Role (M3) | Size / line / weight | Usage in product |
|---|---|---|---|
| `type.display` | Display S | 32 / 40 / 800 | Big celebratory numbers (level-up) |
| `type.headline` | Headline S | 24 / 32 / 800 | Hero stat, organ score (`OrganCard` score is 26/800) |
| `type.title` | Title M | 17 / 24 / 700 | Card titles (`OrganCard` title) |
| `type.subtitle` | Title S | 15 / 22 / 700 | Buttons (`ui.tsx` btn 15/700), section heads |
| `type.body` | Body M | 14 / 20 / 400–600 | Marker labels, body copy |
| `type.bodyStrong` | Body M (emph) | 16 / 22 / 800 | Marker value |
| `type.caption` | Label M | 12 / 16 / 700 | Pills (`pillText` 12/700) |
| `type.micro` | Label S | 11 / 16 / 600 | Ranges, units (`range`/`unit` 11) |

### 6.3 Dynamic type

Type sizes are expressed in scalable units and respond to the OS font-size setting up to **200%** without truncation or overlap (§12, DS-013). Layouts use flexible, wrapping containers; numbers never clip. Above ~130% scale, multi-column rows reflow to stacked layouts.

---

## 7. Spacing, grid & layout

### 7.1 Base unit & rhythm

The base unit is **4px** (`space()`); all spacing is a multiple. Vertical rhythm within a card uses `space.3` (12) as the default gap (matching `OrganCard`'s `gap: space(3)`).

### 7.2 Patient app layout

- Single-column, scroll-first, **one-handed**: primary actions sit in the lower 2/3 of the screen.
- Screen gutters: `space.4` (16) on phones.
- Bottom tab bar (Home / Log / Learn / Profile per Volume 2) is the persistent nav; safe-area insets respected on all edges.
- Cards are the primary container (radius `lg`, elevation 2, `space.4` padding) — the `Card` primitive in `ui.tsx`.

### 7.3 Web panel grid

- **12-column** responsive grid, max content width 1440, gutter `space.6` (24).
- Breakpoints: `sm 600`, `md 905`, `lg 1240`, `xl 1440` (M3 window-size classes).
- Data tables and the patient-list/detail split-view collapse to stacked on `< md`.

### 7.4 Responsive behavior

The shared components are size-agnostic; layout composition differs per platform but components keep identical anatomy and a11y semantics (P5).

---

## 8. Elevation, corner radius & iconography

### 8.1 Elevation usage

| Surface | Token |
|---|---|
| Background content | `elevation.0` |
| List rows / inset items | `elevation.1` |
| Cards (default) | `elevation.2` |
| Bottom sheets, dialogs, menus, snackbars | `elevation.3` |

### 8.2 Corner radius usage

Cards/sheets `radius.lg`; buttons `radius.md`; inputs/chips `radius.sm`; pills/badges/streak `radius.pill`. Nested elements step **down** one radius level from their container.

### 8.3 Iconography

- **Library:** Material Symbols (Rounded) for both platforms, to match M3 and the rounded radius language. One library only — no mixing.
- **Sizes:** 20 (inline), 24 (default/touch icons), 40 (organ glyph hero, matching `OrganCard` emoji 40).
- **Status icons (mandatory shapes):** in-range = check `✓`; borderline/at-risk = triangle `▲`; out-of-range/critical = ✕/■. These shapes are fixed and color-blind-distinct (§11.5).
- **Emoji caveat:** the prototype uses emoji for organs (`❤️`/`🫘`) and tabs. Emoji render inconsistently across OS versions and have weak a11y. Roadmap: replace clinical/organ emoji with **Material Symbols + custom organ illustrations** (§9) carrying explicit `accessibilityLabel`s; tab/decorative emoji may remain if given labels.

---

## 9. Illustration & organ visual language

### 9.1 Organ illustration system

The organ visualization is the product's **signature** (Volume 1). Each organ (heart, kidney; future: eyes, nerves, liver) is a custom vector illustration with a **health-state morphology**:

| Organ state (score band) | Visual treatment |
|---|---|
| Thriving (≥ 80) | Full saturation of identity color, smooth contours, gentle idle "breathing" pulse |
| Healthy (60–79) | Identity color, calm, no idle motion |
| Strained (40–59) | Slightly desaturated, subtle texture/strain lines |
| At risk (20–39) | More desaturated, visible strain, slower implied rhythm |
| Critical (< 20) | Most desaturated; **never** gore or shock imagery (P2) — strain shown through form/texture + label, not alarm color |

> The illustration's **state is never communicated by color alone** — the gauge value, the status label, and the morphology all co-encode. Critical state must remain **non-alarming and non-shaming**: a supportive "let's bring this back up" framing accompanies it.

### 9.2 Style guide

- Flat-with-soft-depth, 2px optical strokes, rounded joins (matches radius language).
- Identity colors per §4.4; supportive, warm neutral backgrounds.
- All illustrations ship light + dark variants and carry descriptive alt text.

### 9.3 Illustration don'ts

No medical-textbook realism, no blood/wounds, no fear imagery, no anthropomorphized sad/angry organs (that crosses from honest into manipulative — P3).

---

## 10. Component library

Each component lists **anatomy → variants → states → key props → a11y notes**. Existing components reference their prototype file; "new" components are specified for build. All components are themeable via tokens and exist in both platforms unless noted.

### 10.1 Existing components (formalized)

#### 10.1.1 Card — `src/components/ui.tsx`
- **Anatomy:** rounded container (`radius.lg`), `space.4` padding, 1px `outline` border, `elevation.2`, `surface` background.
- **Variants:** default; `flat` (no shadow); `interactive` (adds press state for tappable cards).
- **States:** rest / pressed (interactive) / disabled.
- **Props:** `children`, `style`. (Add `onPress?`, `accessibilityRole` for interactive variant.)
- **A11y:** when interactive, role `button` + accessible name; grouping role `summary` when purely presentational.

#### 10.1.2 Button — `ui.tsx`
- **Anatomy:** label centered; `radius.md`; vertical `space(3.5)`, horizontal `space.5`.
- **Variants:** `primary` (filled, `primary`/`onPrimary`), `ghost` (outline, `primary` text). **Add:** `tonal` (M3 secondary), `text` (low-emphasis), `destructive` (uses status colors **with** confirmatory copy, never one-tap-destructive without confirm).
- **States:** rest / pressed (opacity .85, per prototype) / disabled (opacity .4) / **focus-visible (web: visible ring, DS-012)** / loading (spinner replaces label, retains width).
- **Props:** `label`, `onPress`, `variant`, `disabled`, (add) `loading`, `icon`, `accessibilityHint`.
- **A11y:** role `button`; min target 48×48 (DS-011) — current vertical padding yields ~46px height with 15px text, **must be padded to ≥ 48**; disabled state exposes `accessibilityState={{disabled:true}}`.

#### 10.1.3 ProgressBar — `ui.tsx`
- **Anatomy:** rounded track (`outline` bg) + fill (color prop), height configurable (10 default, 12 in `OrganCard`).
- **Variants:** determinate (value 0..1); add `indeterminate`.
- **States:** value clamps 0..1 (already implemented).
- **A11y:** role `progressbar` with `accessibilityValue={{min:0,max:100,now}}`; **must not be the only indicator** — pair with numeric label.

#### 10.1.4 Pill / Status chip — `ui.tsx`
- **Anatomy:** pill (`radius.pill`); 13%-alpha tint of hue bg; full-hue text; `space(2.5)`/`space(1)` padding.
- **Variants:** status (in-range/borderline/out-of-range/critical/at-risk/healthy), neutral, accent (xp).
- **States:** static.
- **Props:** `label`, `color`. **Add `icon`** so the mandatory status **shape** (§4.2) renders alongside text.
- **A11y:** the label text carries meaning; chip is not interactive; ensure 4.5:1 text-on-tint (§4.5, DS-004). **This is the front line of the "color is never the only signal" rule** — DS-005 requires the icon prop be populated for all clinical statuses.

#### 10.1.5 MarkerRow — `src/components/MarkerRow.tsx`
- **Anatomy:** label + target range (caption) | value with unit | status pill.
- **Variants:** default; add `withSparkline` (inline 7-pt trend, §11).
- **States:** in-range / borderline / out-of-range (from `markerStatus`).
- **Props:** `def: MarkerDef`, `value`.
- **A11y:** row exposes a single combined label, e.g. *"Blood glucose, 150 mg/dL, out of range, target 80 to 140"* — not three disjoint reads. Unit spoken in full ("milligrams per deciliter") via mapping.

#### 10.1.6 OrganCard — `src/components/OrganCard.tsx`
- **Anatomy:** organ glyph (40) | title + optional delta | score (headline) + status pill | progress gauge | blurb.
- **Variants:** default; add `compact` (panel), `expanded` (tap → detail with trend + contributing markers).
- **States:** five status bands (`organStatus`); **delta** badge (+heal/−damage) colored good/bad with sign as the redundant cue.
- **Props:** `organ: OrganDef`, `score`, `delta?`.
- **A11y:** combined label *"Heart, score 70 of 100, healthy, up 1.5 today"*; the gauge is decorative-redundant to the spoken score; **ripple animation respects reduced-motion** (§14).

### 10.2 New components (to build)

#### 10.2.1 AlertBanner
- **Anatomy:** leading status icon (shape) | message | optional action button | optional dismiss.
- **Variants:** `info` (primary), `success` (in-range), `warning` (borderline), `error` (out-of-range). **Never** uses critical-red for non-critical info (P2).
- **States:** static / dismissible / with-action.
- **Props:** `severity`, `title`, `body`, `action?`, `onDismiss?`.
- **A11y:** `role="alert"`/`accessibilityLiveRegion="polite"` (assertive only for true safety alerts per Volume 6); icon shape + text co-encode severity. Non-shaming copy for warning/error.

#### 10.2.2 Badge (achievement)
- **Anatomy:** circular/medal illustration | name | locked/unlocked state.
- **Variants:** locked (grayscale silhouette) / unlocked (full color + xp accent) / new (subtle highlight, no nag).
- **States:** locked / unlocked / just-earned (one-shot celebration).
- **A11y:** name + state ("Hydration Hero, unlocked"); celebration animation reduced-motion aware.

#### 10.2.3 StreakIndicator (forgiving streak)
- **Anatomy:** flame/spark glyph (xp accent) | day count | **grace-day** marker.
- **Variants:** active / grace-active (grace day used, streak preserved — framed positively) / restarting.
- **States:** must visually communicate the *forgiving* mechanic: a missed day shows a neutral "grace day" not a broken/red streak (P3). **No** guilt color, no "you lost your streak" shaming.
- **A11y:** "7-day streak, grace day available"; never an urgent live-region nag.

#### 10.2.4 DevicePairingCard (Volume 5)
- **Anatomy:** device illustration | name/type (CGM/BGM/BP/scale) | connection status (with icon + label) | pair/forget action | last-sync time.
- **Variants:** unpaired / pairing (progress) / connected / error (with recovery steps).
- **States:** scanning / pairing / connected / disconnected / battery-low (icon + label).
- **A11y:** connection state spoken; pairing progress announced politely; error states give actionable recovery, not just red.

#### 10.2.5 ChatBubble (AI Health Coach, Volume 6)
- **Anatomy:** bubble (user = `primary` tonal, right; assistant = `surface.variant`, left) | text | timestamp | optional source/disclaimer chip.
- **Variants:** user / assistant / system-disclaimer.
- **States:** sending / sent / streaming (typing) / error/retry.
- **Mandatory:** assistant messages that touch health guidance carry the **safety disclaimer affordance** required by Volumes 6 & 8 (e.g., "Educational, not medical advice"); never styled to impersonate a clinician.
- **A11y:** each bubble labeled with speaker + time; streaming text announced in chunks, not per character; reduced-motion disables typing animation.

#### 10.2.6 ConsentDialog (Volume 8)
- **Anatomy:** title | scannable purpose summary | granular toggles (e.g., data sharing, device access) | primary "Agree" + equal-weight "Not now" | link to full policy.
- **Variants:** onboarding consent / per-feature consent / re-consent on policy change.
- **States:** default / partially-consented / blocked-feature explanation.
- **Mandatory (anti-dark-pattern, P3):** "Agree" and "Decline/Not now" are **equal visual weight** (no tiny grey decline); no pre-checked sensitive toggles; plain-language summaries.
- **A11y:** focus trapped within dialog; first focus on title; `role="dialog"`/`aria-modal`; ESC/back dismiss; scrim is `color.scrim`.

#### 10.2.7 Chart components — see §11.

### 10.3 Component states matrix (applies to all interactive components)

`rest`, `hover` (web), `focus-visible` (web ring; Android focus for keyboard/switch access), `pressed`, `selected`, `disabled`, `loading`, `error`. Every interactive component must define all applicable states; missing a `focus-visible` or `disabled` state is a defect (DS-012).

---

## 11. Data-visualization guidelines

### 11.1 Principles for charts

Charts inherit P1 (clarity) and P4 (a11y). Every chart: has a title and axis labels; states its units; provides a **non-visual equivalent** (data table / accessible summary); and **never relies on color alone** to distinguish series or status (§11.5).

### 11.2 Marker trend charts
- Line/area trend per marker over time with the **healthy band shaded** (in-range tint) so "in vs out" reads pre-attentively.
- Out-of-range points get a **shape** marker (filled triangle/square) in addition to color; in-range points are dots.
- Inline 7-point **sparkline** variant for `MarkerRow withSparkline`.
- Touch: tap a point → callout with value + status label.

### 11.3 AGP-style glucose graph (regulated data, Volume 5)
- Ambulatory Glucose Profile convention: median line + IQR (25–75) band + 10–90 percentile band over a 24h composite.
- **Target range overlay** (e.g., 70–180 mg/dL or unit equivalent) shaded as the in-range tint; time-in-range bar accompanies it.
- Percentile bands distinguished by **opacity steps + labels**, not hue alone.
- Clear "this is summarized data" labelling; unit-aware axis (mg/dL or mmol/L per §15.4).

### 11.4 Organ-health gauges
- Radial or linear gauge mapping the 0–100 organ score to the **status ramp** (in-range→critical) with the **numeric score always shown** (the `OrganCard` ProgressBar is the linear form).
- Threshold ticks at the band boundaries (20/40/60/80) so the qualitative band is readable without color.
- Delta indicator uses **sign + arrow shape** (▲/▼) plus color.

### 11.5 Color-blind-safe encoding (mandatory)

Color is one of **at least two** channels for any meaning-bearing element:

| Meaning | Color | + Shape | + Label/pattern |
|---|---|---|---|
| In range | green `#16a34a` | dot / check | "In range" / solid band |
| Borderline | amber `#d97706` | triangle | "Borderline" / hatched band |
| Out of range | red `#dc2626` | square / ✕ | "Out of range" / dotted edge |
| Series A vs B (e.g., heart vs kidney) | identity hue | distinct dash/marker | direct labels (preferred over legend) |

- The palette is validated against **deuteranopia, protanopia, tritanopia** simulations (Volume 9 test).
- Prefer **direct labeling** of series over legends.
- Provide an optional **high-contrast / pattern mode** that adds patterns to all status fills.

### 11.6 Chart accessibility
- Every chart exposes an **accessible summary** (e.g., "Glucose trend, last 7 days: 4 of 7 days in range, trending down") and a togglable **data table** view.
- Color choices, gridlines, and focus on data points all meet the 3:1 non-text contrast floor.

---

## 12. Accessibility specification

**Target: WCAG 2.1 Level AA** across patient app and web panel (the patient app applies WCAG to native equivalents; the web panel is literally WCAG-testable). Volume 9 owns automated/manual verification.

### 12.1 Contrast
Per §4.5: text 4.5:1 (3:1 large), non-text/UI 3:1. Status chips, gauges, focus rings, and meaningful icons all meet their floor in **both** themes (DS-004).

### 12.2 Touch targets
Minimum **48×48 dp** (Android/Material) interactive target, **44×44 px** absolute floor on web (WCAG 2.5.5 AAA aspiration 44; we hold 48 as the design default). Targets may visually appear smaller but must have ≥48dp hit-slop. (Current `Button` padding must be verified/raised to meet this — DS-011.)

### 12.3 Screen reader & labels
- Every interactive element and every meaning-bearing graphic has an `accessibilityLabel` (RN) / accessible name (web).
- Composite rows (MarkerRow, OrganCard) expose a **single coherent label**, not fragmented reads (§10.1.5/6).
- Decorative-only elements are hidden from AT (`accessibilityElementsHidden` / `aria-hidden`).
- Live regions: polite for status updates; assertive reserved for genuine safety alerts (coordinated with Volume 6).

### 12.4 Dynamic type
Supports OS text scaling to **200%** without loss of content or function; layouts reflow (§6.3). DS-013.

### 12.5 Reduced motion
Honor `prefers-reduced-motion` (web) / `AccessibilityInfo.isReduceMotionEnabled` (RN). When set: organ ripple, celebrations, typing animation, and gauge sweeps are replaced by instant state changes or a single static cue (DS-014).

### 12.6 Focus & keyboard (web; switch/keyboard on Android)
- Logical, predictable focus order following reading order.
- Visible **focus indicator** (`color.focus`, ≥3:1, never removed) on all focusable elements (DS-012).
- No keyboard traps (except intentional modal focus-trap that back/ESC releases).
- All actions reachable without a pointer.

### 12.7 Other
- Form fields have programmatic labels, error text (not color-only), and `accessibilityHint` where useful.
- Time-outs (e.g., consent/session) are adjustable or warned (Volume 8 alignment).
- Captions/transcripts for any video lesson content (Volume 2/Learn).

---

## 13. Dark mode & RTL

### 13.1 Dark mode
- Fully supported and token-driven (§5.2). Follows OS theme by default; user override available.
- **Rule set:** (a) status **hues are preserved** so meaning is stable; (b) chip **text** and **identity** colors are lightened to hold ≥4.5:1 on dark surfaces; (c) rely on **tonal elevation** over shadows; (d) avoid pure black (`#000`) and pure white text — use `#0b1220` surface and `#e8eef7` text to reduce halation; (e) re-run all contrast tests per theme (DS-016).
- Illustrations and charts ship dark variants; shaded "healthy band" tints are re-tuned for dark backgrounds.

### 13.2 RTL
- Full **RTL** support (Arabic, Hebrew, etc.): layouts mirror (use start/end, never left/right in styles); RN `I18nManager` and web `dir="rtl"` drive direction.
- Icons that imply direction (back/next, trend arrows) mirror; **status icons and numerals do not** mirror; charts keep time flowing in the locale's reading direction where appropriate, with axis labels respecting it.
- All new layout work uses logical properties (`marginStart`/`paddingEnd`) so mirroring is automatic (DS-017).

---

## 14. Motion & animation

### 14.1 Philosophy
Motion is **functional and restrained** (P1, P2): it explains causality, confirms actions, and directs attention — it never decorates idly or creates urgency. Default to **less**.

### 14.2 The organ "ripple" (signature)
When a logged action moves markers, a **ripple** emanates from the action toward the affected organ glyph, and the organ gauge animates to its new value — making cause→effect *visible* (Volume 1's core aesthetic). Constraints:
- Single, calm ripple; one easing; ≤ ~600ms total.
- Heal vs damage differ by **direction + status color + a label**, not intensity/alarm.
- **Fully suppressed under reduced motion** → gauge snaps to new value with a brief static highlight (DS-014).

### 14.3 Other motion
- Page/sheet transitions: standard M3 emphasized easing, short.
- Celebrations (level-up, badge): brief, one-shot, never blocking, dismissible, reduced-motion-aware.
- Streaming chat: subtle typing indicator (not per-char jitter); off under reduced motion.
- **No** infinite loops, parallax, flashing (≤3 flashes/sec hard rule — WCAG 2.3.1), or attention-hijacking loops.

### 14.4 Motion tokens

| Token | Value | Usage |
|---|---|---|
| `motion.duration.short` | 120ms | state-layer, small toggles |
| `motion.duration.medium` | 240ms | transitions, gauge sweep |
| `motion.duration.long` | 480–600ms | organ ripple, celebrations |
| `motion.easing.standard` | `cubic-bezier(0.2,0,0,1)` | most motion |
| `motion.easing.emphasized` | `cubic-bezier(0.2,0,0,1)` (M3 emphasized) | enter/expand |
| `motion.reduced` | `0ms` / instant | reduced-motion fallback |

---

## 15. Localization & internationalization

### 15.1 String handling
- **Zero hard-coded user-facing strings**; all via i18n keys with a default-locale fallback.
- Keys are namespaced (`home.streak.title`); copy reviewed for the non-shaming, supportive tone (P2/P3) per locale.
- Allow **+40% string expansion** in layouts (German/Finnish) without truncation; no fixed-width text containers.

### 15.2 Pluralization & gender
- Use ICU MessageFormat for plurals/select (e.g., `{count, plural, one {# day} other {# days}}`) — never string concatenation for "1 day"/"2 days".

### 15.3 Locale formats
- Dates, times, numbers, and decimal/grouping separators via the platform `Intl`/locale APIs — never manual formatting.
- First-day-of-week and 12/24h respect locale.

### 15.4 Glucose & clinical units (mg/dL ↔ mmol/L)
- The app supports **mg/dL** (current `MARKERS` default, US) and **mmol/L** (most of the world). Conversion: `mmol/L = mg/dL ÷ 18.0182` (round to 1 decimal for mmol/L, integer for mg/dL).
- Unit is a **user/locale preference**, applied **everywhere consistently** — marker values, ranges (`MarkerRow` "target 80–140"), AGP target overlay, chat, and clinician panel — driven by one formatter, never per-screen logic (DS-015).
- The unit is **always displayed** next to glucose values (no ambiguous bare numbers) and spoken in full by screen readers.
- Cholesterol (LDL) likewise supports mg/dL ↔ mmol/L (÷38.67); blood pressure stays mmHg.

### 15.5 RTL & bidi
Covered in §13.2; numerals and units handle bidi isolation so unit labels don't reorder incorrectly in RTL.

---

## 16. Token delivery: theme.ts & web mapping

### 16.1 Pipeline
A single source token file (§5.7) compiles via Style Dictionary to two outputs: **`src/theme.ts`** (RN object, the shape the prototype already uses) and **web CSS custom properties** (`:root` + `[data-theme="dark"]`). Designers' Figma styles mirror token names so design↔code drift is detectable.

### 16.2 Mapping to existing `theme.ts`
The current `theme.ts` is the seed. The mapping is **additive and backward-compatible**:

| Existing `theme.ts` key | Design-system token | Notes |
|---|---|---|
| `colors.primary` `#2563eb` | `color.primary` | unchanged |
| `colors.primaryDark` `#1d4ed8` | `color.primary.pressed` | renamed role |
| `colors.bg` `#f5f8fc` | `color.background` | unchanged |
| `colors.card` `#ffffff` | `color.surface` | unchanged |
| `colors.text` `#0f172a` | `color.onSurface` | unchanged |
| `colors.subtext` `#64748b` | `color.onSurface.variant` | unchanged |
| `colors.border` `#e2e8f0` | `color.outline` | unchanged |
| `colors.good` `#16a34a` | `color.status.inRange` | unchanged |
| `colors.warn` `#d97706` | `color.status.borderline` | unchanged |
| `colors.bad` `#dc2626` | `color.status.outOfRange` / `.critical` | unchanged |
| `colors.heart` `#ef4444` | `color.organ.heart` | unchanged |
| `colors.kidney` `#8b5cf6` | `color.organ.kidney` | unchanged |
| `colors.xp` `#f59e0b` | `color.xp` | unchanged |
| `radius.{sm,md,lg,pill}` | `radius.*` | unchanged |
| `space(n)` | `space.*` | function preserved; named steps added |
| `shadow` | `elevation.2` | level named; 0/1/3 added |

> Because the status colors in `physiology.ts` (`organStatus`/`markerStatus`) currently hard-code the same hexes, those functions should source from tokens to guarantee a single origin (DS-018). Until then, the spec **freezes** those hexes as the canonical status values so code and tokens cannot diverge.

### 16.3 Theme switching
`ThemeProvider` exposes the active token set (light/dark/high-contrast) via context; components read tokens from context, never import raw values. Web uses `data-theme` attribute + CSS vars; RN uses the provider object.

---

## 17. Design requirements (DS-001 …)

Stable IDs; each is independently testable. Verification is owned by Volume 9.

| ID | Requirement | Acceptance criteria |
|---|---|---|
| **DS-001** | All UI consumes design tokens; no raw hex/px in components. | Lint rule fails build on raw color/spacing literals in `src/components` and web components; audit shows 0 violations. |
| **DS-002** | Shared system spans patient app and clinician panel on an M3 foundation. | A status pill, button, and card render with identical semantics/anatomy and tokenized styling on both platforms. |
| **DS-003** | Clinical-status colors are fixed and immune to dynamic color/theming. | With Material You enabled, status & gauge hues equal the canonical hexes in §4.2; only neutral/brand surfaces may retint. |
| **DS-004** | All text and meaningful non-text meet WCAG AA contrast in light **and** dark. | Automated contrast test passes for every token pairing in §4.5 in both themes; 0 failures. |
| **DS-005** | Color is never the sole carrier of clinical status. | Every status indicator (pill, point, gauge, banner) presents an icon **shape** and/or text **label** in addition to color; verified by audit + the §11.5 matrix. |
| **DS-006** | Status semantics map exactly to `markerStatus`/`organStatus`. | In-range/borderline/out-of-range and the five organ bands render the labels and colors defined in `physiology.ts`. |
| **DS-007** | Component library covers existing + new components with full state sets. | Card, Button, ProgressBar, Pill, MarkerRow, OrganCard, AlertBanner, Badge, StreakIndicator, DevicePairingCard, ChatBubble, ConsentDialog, and chart components exist with documented variants/states. |
| **DS-008** | Forgiving-streak and progress UI never punish or shame. | StreakIndicator shows grace-day positively; no red "streak lost" state; copy review confirms non-shaming tone. |
| **DS-009** | Consent and destructive dialogs are free of dark patterns. | ConsentDialog: equal-weight agree/decline, no pre-checked sensitive toggles; destructive actions require confirmation. |
| **DS-010** | Charts provide non-visual equivalents. | Each chart exposes an accessible summary + togglable data table; screen-reader review passes. |
| **DS-011** | Interactive targets ≥ 48dp (44px web floor). | Measured hit area of every interactive element ≥ minimum; Button padding raised to meet it. |
| **DS-012** | All interactive components have a visible focus state. | Keyboard/switch navigation shows a ≥3:1 focus indicator on every focusable element; none suppressed. |
| **DS-013** | Layouts support dynamic type to 200%. | At 200% scale, no truncation/overlap/clipping on key screens; rows reflow as specified. |
| **DS-014** | Reduced motion is honored everywhere. | With reduce-motion set, ripple/celebrations/typing/gauge-sweep are instant or single static cue; no looping motion. |
| **DS-015** | Glucose/clinical units switch consistently (mg/dL ↔ mmol/L). | Toggling unit updates every value, range, and chart via one formatter; conversion correct to spec precision; unit always shown/spoken. |
| **DS-016** | Dark mode is complete and token-driven. | Every screen renders correctly in dark; status hues preserved; contrast tests pass (DS-004 in dark). |
| **DS-017** | RTL is fully supported. | App mirrors correctly in an RTL locale; logical properties used; directional icons mirror, status icons/numerals do not. |
| **DS-018** | Single source of truth for tokens; `theme.ts` & web derive from it. | Status hexes in `physiology.ts`/`theme.ts` trace to the token file; changing a token updates both platforms via the build pipeline. |
| **DS-019** | All user-facing strings are localizable with ICU plurals. | No hard-coded strings; plurals/select via ICU; layouts tolerate +40% expansion without truncation. |
| **DS-020** | Motion tokens and durations are respected. | All animations use `motion.*` tokens; no animation exceeds defined durations; no flashing >3/sec. |

---

## 18. Traceability & cross-references

This volume operationalizes the experience promised in the vision and provides the shared visual contract every other volume renders through.

- **[01-product-vision.md](01-product-vision.md)** — Product principles, SDT motivation, the organ-impact differentiator, and the calm/non-shaming product posture that P2/P3 here implement.
- **[02-android-app-prd.md](02-android-app-prd.md)** — Patient-app information architecture, screens, and flows that compose these components; this volume supplies their look, states, and a11y.
- **[03-doctor-panel.md](03-doctor-panel.md)** — The web clinician panel that shares this system (§3.2, §7.3); density and data-table guidance live here.
- **[04-backend.md](04-backend.md)** — Data contracts feeding marker/AGP/organ charts (§11); unit preference persistence (§15.4).
- **[05-medical-devices.md](05-medical-devices.md)** — DevicePairingCard, connection/battery states, and AGP regulated-glucose presentation (§10.2.4, §11.3).
- **[06-ai-system.md](06-ai-system.md)** — ChatBubble, mandatory safety-disclaimer affordances, and live-region severity rules (§10.2.5, §12.3).
- **[08-security-compliance.md](08-security-compliance.md)** — ConsentDialog anti-dark-pattern rules, re-consent flows, and session-timeout UX (§10.2.6, §12.7).
- **[09-qa-testing.md](09-qa-testing.md)** — Owns automated/manual verification of the DS-001…DS-020 acceptance criteria, contrast and color-blind simulations, and screen-reader test passes.
- **[10-claude-code-build-playbook.md](10-claude-code-build-playbook.md)** — How tokens, components, and the Style-Dictionary pipeline (§16) are scaffolded and enforced in the build.

_Canonical design-system version documented here: **`design-system@1.0`**. Status-color values are frozen against `src/theme.ts` and `src/engine/physiology.ts`; any change is a coordinated, versioned update across tokens, both platforms, and Volume 9 tests._
