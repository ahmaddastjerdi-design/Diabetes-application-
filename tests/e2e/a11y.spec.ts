import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Accessibility smoke on the public entry points (no auth required). Fails on any
// serious/critical WCAG 2 A/AA violation (docs/ACCESSIBILITY_CHECKLIST.md §10).
for (const path of ['/', '/login', '/register', '/medical-disclaimer']) {
  test(`no serious a11y violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([]);
  });
}
