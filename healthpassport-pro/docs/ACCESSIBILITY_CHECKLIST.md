# HealthPassport Pro — Accessibility Checklist (WCAG 2.2 AA)

Status: Phase 0 · Owner: Senior Medical UX Designer

Target: **WCAG 2.2 Level AA**. Our users skew older and may have chronic-disease
comorbidities affecting vision, dexterity, and cognition, so accessibility is
core to the product, not a bolt-on. Medical status is **never** communicated by
color alone.

Legend: ☐ to build · ☑ verified (updated as phases land and in Phase 10 audit).

---

## 1. Structure & semantics
- ☐ Semantic HTML landmarks (`header`, `nav`, `main`, `footer`); one `h1` per
  page; logical heading order.
- ☐ Lists, tables, and forms use native semantic elements.
- ☐ Meaningful page `<title>` per route.

## 2. Forms & labels
- ☐ Every input has a programmatic `<label>` (shadcn/ui + RHF wiring).
- ☐ Required fields indicated in text (not color/asterisk alone).
- ☐ Errors: `aria-invalid`, `aria-describedby`, text message, and focus moved to
  the first error (WCAG 3.3.1/3.3.3).
- ☐ Inputs use correct `type`, `inputmode`, and `autocomplete`.

## 3. Keyboard & focus
- ☐ All interactive controls reachable and operable by keyboard; logical tab
  order; no keyboard traps.
- ☐ Visible focus indicator on every focusable element (WCAG 2.4.7).
- ☐ Modals/dialogs trap focus, restore focus on close, close on Escape.
- ☐ Skip-to-content link.
- ☐ **2.5.8 Target Size (Minimum)** — interactive targets ≥ 24×24 px (we use ≥ 44 px).
- ☐ **2.4.11 Focus Not Obscured** — focused element not hidden by sticky UI.

## 4. Color & contrast
- ☐ Text contrast ≥ 4.5:1 (≥ 3:1 large text); UI/graphic contrast ≥ 3:1.
- ☐ **No color-only medical status** — every status pairs color with an icon
  and text label (e.g. "⚠ High — above target").
- ☐ Light and dark themes both meet contrast.

## 5. Readability & sizing
- ☐ Base font size comfortable (≥ 16px); large, readable typography.
- ☐ Layout reflows and remains usable at 200% zoom / 320px width (WCAG 1.4.10).
- ☐ Respect user text-size and reduced-motion preferences.

## 6. Status & feedback (screen-reader friendly)
- ☐ Loading/success/error and **safety escalations** announced via
  `aria-live`/`role="status"`/`role="alert"` as appropriate.
- ☐ Charts (Recharts) have text alternatives / summaries; data also available in
  a table or accessible label (not chart-only).

## 7. Media & icons
- ☐ Icons are decorative (`aria-hidden`) with adjacent text, or have accessible
  names.
- ☐ Images/documents have alt text where meaningful.

## 8. Motion & timing
- ☐ Respect `prefers-reduced-motion`; no essential info conveyed by motion alone.
- ☐ No content that flashes > 3×/second.
- ☐ No unexpected session timeouts without warning + extend option.

## 9. Content & language
- ☐ Plain language; short sentences; define medical terms.
- ☐ `lang`/`dir` set correctly (RTL supported for future locales).

## 10. Verification (Phase 10)
- ☐ Automated: `axe`/`@axe-core/playwright` in the e2e suite; ESLint jsx-a11y.
- ☐ Manual: keyboard-only pass, screen-reader pass (VoiceOver/NVDA), 200% zoom,
  contrast audit on every screen.
- ☐ Elderly-friendly review: tap targets, legibility, one primary action/screen.
