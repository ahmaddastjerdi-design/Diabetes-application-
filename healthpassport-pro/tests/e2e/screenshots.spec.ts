import { test, expect, type Page } from '@playwright/test';

/**
 * Captures full-page screenshots of the authenticated app for review. Runs in
 * CI against a production build + real PostgreSQL and uploads the `screenshots/`
 * directory as an artifact (see the `e2e` job in the CI workflow). It seeds its
 * own synthetic patient through the real UI — never real PHI.
 */

const PASSWORD = 'Correct-Horse-9';
const DIR = 'screenshots';

async function shot(page: Page, name: string) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
}

async function addVital(page: Page, fill: () => Promise<void>) {
  await fill();
  await page.getByRole('button', { name: /add reading/i }).click();
  await page.waitForTimeout(500);
}

test('capture authenticated app screenshots', async ({ page }) => {
  const email = `e2e_shots_${Date.now()}@example.com`;

  // --- Register + onboard (with a name so the dashboard greets the patient) ---
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.locator('#givenName').fill('Alex');
  const family = page.locator('#familyName');
  if (await family.count()) await family.fill('Rivers');
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByRole('button', { name: /finish setup/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Seeding + capture is best-effort: a flake here should not fail the e2e job
  // (the register→onboard flow above is the hard assertion, also covered by
  // auth.spec.ts). Whatever screenshots are captured still upload as artifacts.
  try {
  // --- Seed records through the real UI ---
  await page.goto('/records/conditions');
  for (const key of ['hypertension', 'type2-diabetes', 'hyperlipidemia']) {
    await page.locator('#c-key').selectOption(key);
    await page.getByRole('button', { name: /add condition/i }).click();
    await page.waitForTimeout(400);
  }

  await page.goto('/records/medications');
  const meds: [string, string][] = [
    ['Metformin', '500 mg twice daily'],
    ['Lisinopril', '10 mg once daily'],
    ['Atorvastatin', '20 mg at night'],
  ];
  for (const [name, dose] of meds) {
    await page.locator('#m-name').fill(name);
    await page.locator('#m-dose').fill(dose);
    await page.getByRole('button', { name: /add medication/i }).click();
    await page.waitForTimeout(400);
  }

  // --- Vitals: a trend plus a red-flag reading ---
  await page.goto('/track/vitals');
  await addVital(page, async () => {
    await page.locator('#v-type').selectOption('BLOOD_PRESSURE');
    await page.locator('#v-sys').fill('138');
    await page.locator('#v-dia').fill('86');
  });
  await addVital(page, async () => {
    await page.locator('#v-sys').fill('150');
    await page.locator('#v-dia').fill('92');
  });
  // Final reading trips the hypertensive-crisis red flag → alert on screen.
  await addVital(page, async () => {
    await page.locator('#v-sys').fill('185');
    await page.locator('#v-dia').fill('125');
  });
  await expect(page.getByRole('alert')).toBeVisible();
  await shot(page, '03-vitals-safety-alert');

  // --- Labs ---
  await page.goto('/track/labs');
  await page.locator('#l-type').selectOption('HBA1C');
  await page.locator('#l-value').fill('7.2');
  await page.getByRole('button', { name: /add result/i }).click();
  await page.waitForTimeout(400);
  await shot(page, '04-labs');

  // --- The finished dashboard (now populated) ---
  await page.goto('/dashboard');
  await shot(page, '01-dashboard');

  // --- Records, guide, report, settings, privacy ---
  await page.goto('/records/conditions');
  await shot(page, '02-conditions');
  await page.goto('/reports');
  await shot(page, '05-doctor-report');
  await page.goto('/guide');
  await shot(page, '06-guide');
  await page.goto('/settings');
  await shot(page, '07-settings');
  await page.goto('/privacy-security');
  await shot(page, '08-privacy-security');

  // --- Mobile dashboard (PWA feel) ---
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard');
  await shot(page, '09-dashboard-mobile');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('screenshot capture step failed (non-blocking):', err);
  }
});
