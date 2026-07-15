import { test, expect } from '@playwright/test';

const PASSWORD = 'Correct-Horse-9';

async function registerAndOnboard(page: import('@playwright/test').Page) {
  const email = `e2e_safety_${Date.now()}@example.com`;
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByRole('button', { name: /finish setup/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test('a red-flag reading + symptom triggers an emergency escalation', async ({ page }) => {
  await registerAndOnboard(page);

  await page.goto('/track/vitals');
  // Blood pressure is the default measurement (systolic/diastolic fields shown).
  await page.locator('#v-sys').fill('185'); // ≥180 → hypertensive-crisis (URGENT)
  await page.locator('#v-dia').fill('125'); // ≥120
  // Co-reporting a red-flag symptom escalates the reading to EMERGENCY.
  await page.getByRole('checkbox', { name: /chest pain/i }).check();
  await page.getByRole('button', { name: /add reading/i }).click();

  // Let the server action settle on a cold CI runner.
  await page.waitForLoadState('networkidle').catch(() => {});

  // Scope to the SafetyAlert (not Next's empty route-announcer alert) by its
  // content. The EMERGENCY heading is "This may need emergency care".
  const alert = page.getByRole('alert').filter({ hasText: /emergency care/i });
  await expect(alert).toBeVisible({ timeout: 15000 });
  await expect(alert).toContainText(/very high/i); // the blood-pressure finding
});
