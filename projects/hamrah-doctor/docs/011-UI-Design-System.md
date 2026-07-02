# HD-OS UI Design System (Flutter-first)

> **Document 011 of the HD-OS documentation suite.**
> The single source of truth for how HD-OS looks, feels, and behaves across the
> Flutter patient app and the (React) clinician/admin web — one **Material 3** token
> system, RTL/Farsi-first, WCAG 2.2 AA, with a clinical data-visualization language.
> Elaborates CLAUDE.md §7 (naming), §8 (Flutter), §14 (UI), §15 (accessibility).
> Subordinate to the Meta Spec and Constitution; on conflict the safety-higher rule
> governs (CLAUDE.md §0.3).

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | `HDOS-DOC-011` |
| **Title** | HD-OS UI Design System |
| **Type** | Design / Engineering Standard (foundational) |
| **Version** | `1.0.0` |
| **Status** | `DRAFT` |
| **Owner** | Design Lead · Head of Engineering (co-owners) |
| **Approvers** | Design Lead · Accessibility owner · CMO (clinical data display) |
| **Related** | `HDOS-DOC-001` §8/§14/§15 · `-004` (shares tokens app↔web) · `-005` (clinical display) · `-012` Accessibility |
| **Stack decision** | Flutter/Dart + Riverpod (ADR-0001); tokens shared with React web |

> ⚕️ **Clinical display is a safety surface.** How a value/range/alert is rendered
> can cause or prevent harm; §6–§7 are governed with CLAUDE.md §5 and reviewed by
> the CMO.

---

## 1. Principles

`HD-UI-SYS-01` **One system, two runtimes.** Flutter (app) and React (web) consume
the **same token definitions** so the two surfaces cannot drift (CLAUDE.md §14).

`HD-UI-SYS-02` **Tokens, never raw values.** No hardcoded colours, sizes, radii,
durations, or type in components (CLAUDE.md §8 `HD-STD-FLUT-0005`, §14
`HD-STD-UI-0002`). Raw values live only in the token source.

`HD-UI-SYS-03` **Never colour alone.** Status/severity is always encoded by
**icon + text/label + shape**, colour is redundant reinforcement (CLAUDE.md §14
`HD-STD-UI-0003`; safety + a11y).

`HD-UI-SYS-04` **RTL/Farsi-first.** Layouts are authored RTL-first and pass in both
directions; directional insets use `start`/`end`, never `left`/`right` (CLAUDE.md
§8 `HD-STD-FLUT-0007`).

`HD-UI-SYS-05` **Accessible by construction.** WCAG 2.2 AA is a gate, not a polish
step (CLAUDE.md §15; `HDOS-DOC-012`).

`HD-UI-SYS-06` **Every state designed.** loading · empty · error · offline ·
success for every screen (CLAUDE.md §14 `HD-STD-UI-0004`).

`HD-UI-SYS-07` **Calm, non-shaming tone.** Motivation grounded in
Self-Determination Theory; forgiving streaks; clinical wording CMO-reviewed
(CLAUDE.md §14 `HD-STD-UI-0007`).

## 2. Material 3 Foundation

`HD-UI-SYS-08` HD-OS uses **Material Design 3** as its foundation. The app uses
Flutter's Material 3 (`useMaterial3: true`) with a custom `ColorScheme` generated
from the brand seed and the HD-OS token overrides in §3. Dynamic color (Android
Material You) MAY tune neutrals but MUST NOT override semantic/clinical tokens
(§3.1, §6) — clinical meaning cannot be themed away.

## 3. Design Tokens

Tokens are defined once (a platform-neutral JSON/Dart source in `/design` and
`/packages`) and generated into a Flutter `ThemeExtension` and CSS variables for
web. Categories:

### 3.1 Color
- **Base roles** (Material 3): primary, secondary, tertiary, surface, background,
  outline, and their `on-` pairs, for **light and dark**.
- **Semantic roles** (HD-OS): `success`, `warning`, `danger`, `info`, `neutral` —
  each with `on-` and container variants; all meet AA contrast in both themes.
- **Clinical band roles** (§6): `range-in`, `range-low`, `range-high`,
  `range-critical`, `unknown` — **fixed meaning, never overridden by dynamic
  color** (`HD-UI-SYS-03`).

### 3.2 Typography
- A single type scale (Material 3 roles: display/headline/title/body/label) with a
  **Farsi-capable** primary typeface and a Latin fallback; line-heights tuned for
  Persian glyphs. Numerals use tabular figures where values align (clinical tables).

### 3.3 Spacing, shape, elevation, motion
- **Spacing:** 4-pt base scale (`space.1`…`space.n`). **Shape:** radii tokens
  (none/sm/md/lg/full). **Elevation:** Material 3 tonal elevation tokens.
- **Motion:** duration + easing tokens; all animation respects **reduce-motion**
  and never conveys critical info by motion alone (CLAUDE.md §14 `HD-STD-UI-0008`).

### 3.4 Token naming
Tokens follow the platform naming language (Meta Spec Ch. 6): UI tokens are namespaced
and referenced as `UI_` artifacts (e.g. `UI_color.danger`, `UI_space.4`). No
component references a value outside the token set.

## 4. Theming

`HD-UI-SYS-09` **Light + dark are first-class.** Both are fully specified and
golden-tested (CLAUDE.md §14 `HD-STD-UI-0006`). No screen is designed for only one.

`HD-UI-SYS-10` **One theme source.** Flutter reads a generated `HdTheme`
`ThemeExtension`; web reads generated CSS variables from the same token source. A
token change updates both.

## 5. Component Library (`UI_` widgets)

`HD-UI-SYS-11` Shared, documented, tested Flutter widgets — no ad-hoc one-off UI in
screens. Each component: (a) consumes only tokens, (b) exposes semantics/labels,
(c) supports RTL + dark + large text, (d) has widget + golden tests (CLAUDE.md §8
`HD-STD-FLUT-0011`). Baseline set:

| Component | Notes |
|-----------|-------|
| `UI_AppScaffold` | safe-area, RTL-aware nav, offline banner slot |
| `UI_Button` (filled/tonal/text/danger) | ≥48dp target, focus/disabled states |
| `UI_TextField` | validation, unit suffix, error text (never echoes PHI) |
| `UI_MarkerRow` | a clinical value: number **+ unit + band chip + icon** (§6) |
| `UI_RangeBar` | value within low/in/high/critical bands, non-colour-only |
| `UI_OrganCard` | educational organ-impact (labelled simulation, §7) |
| `UI_StatTile` | KPI with label + value + unit + trend glyph |
| `UI_Banner` (info/warning/danger) | icon + text + colour; danger non-dismissible |
| `UI_EmptyState` / `UI_ErrorState` / `UI_LoadingState` | mandated per screen |
| `UI_ConsentSheet` | consent capture, plain language, revocable |

## 6. Clinical Data-Visualization Language (safety-governed)

`HD-UI-SYS-12` **Value + unit + band + icon, always.** A clinical measurement is
never a bare number and never colour-only. It renders: numeric value, explicit
**unit** (e.g. mg/dL vs mmol/L via the single audited units utility, CLAUDE.md §5),
a **band** (in-range/low/high/critical) shown by chip/shape/icon **and** colour, and
a timestamp with timezone when temporal (CLAUDE.md §14 `HD-STD-UI-0005`).

`HD-UI-SYS-13` **Honest "unknown".** Missing/stale/uncertain data renders a distinct
`unknown` state — never a fabricated or optimistic value (CLAUDE.md §5
`HD-STD-SAFE-0017`).

`HD-UI-SYS-14` **Precision.** Values shown at clinically-correct precision; no
misleading over-precision. Charts label axes with units and avoid distorting
baselines.

`HD-UI-SYS-15` **Alerts.** Safety notifications are visually distinct, the highest
tier is non-suppressible, and none rely on colour alone (CLAUDE.md §5
`HD-STD-SAFE-0018`).

> Data-viz palettes and chart specs follow an accessible, colour-blind-safe scheme;
> clinical band colours are fixed tokens (§3.1) and reused across app and web.

## 7. Educational Simulation vs Clinical Truth (visual separation)

`HD-UI-SYS-16` Educational/simulation surfaces (e.g. organ-impact visualization) are
**visually and textually labelled as educational** and are **never styled to look
like the clinical record** (CLAUDE.md §5 `HD-STD-CODE-0008`, `HD-STD-SAFE-0016`).
The two lineages are distinguishable at a glance.

## 8. Content, Iconography, Localization

`HD-UI-SYS-17` **No hardcoded strings.** All copy via i18n (Farsi + English min,
RTL-aware); numbers/dates/units locale- and unit-aware (CLAUDE.md §7
`HD-STD-CODE-0050`).

`HD-UI-SYS-18` **Icons carry labels.** Icons are paired with text or accessible
labels; an icon is never the sole carrier of meaning (a11y + `HD-UI-SYS-03`).

`HD-UI-SYS-19` **Tone.** Plain, respectful, non-alarming, non-shaming; encouraging
without dark patterns; no manipulative streak pressure (Constitution Art. I;
CLAUDE.md §14).

## 9. Accessibility Integration

`HD-UI-SYS-20` Every component and screen meets `HDOS-DOC-012` / CLAUDE.md §15:
AA contrast (light+dark), semantics/labels, ≥48dp targets, 200% text scaling,
logical reading order in LTR+RTL, reduce-motion honoured, no seizure-risk media.
Automated a11y checks + golden tests (incl. large-text, RTL, dark) run in CI.

## 10. Flutter Implementation Standards (cross-reference)

Binding Flutter rules live in CLAUDE.md §8 (`HD-STD-FLUT-0001…0011`): clean
layering (presentation/application/domain/data, no Flutter imports in domain),
Riverpod as the single state solution, no business logic in `build()`, tokens-only
styling, semantics + touch targets, RTL, performance (`const`, scoped providers,
virtualised lists), encrypted local PHI storage, explicit offline/sync states, and
widget/golden/integration tests. This design system supplies the tokens and
components those rules consume.

## 11. Definition of Done for UI work

A UI change is done only when (in addition to CLAUDE.md §21): tokens-only (no raw
values); light+dark+RTL+large-text golden tests pass; every state
(loading/empty/error/offline/success) handled; clinical displays follow §6 and,
if clinical, carry CMO review; a11y checks green; strings localized.

---

## Revision History

| Version | Date | Author (role) | Change |
|---------|------|---------------|--------|
| 1.0.0 | (draft) | Design Lead | Initial design system: principles, Material 3 foundation, token system, theming, `UI_` component library, clinical data-viz language, simulation/clinical visual separation, content/localization, a11y integration, Flutter DoD. |

<!-- END OF HDOS-DOC-011. Tokens/components govern all Flutter & web UI. -->
