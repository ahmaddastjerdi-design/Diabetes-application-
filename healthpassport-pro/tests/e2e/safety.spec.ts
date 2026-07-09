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

test('a severe-low glucose reading triggers an emergency escalation', async ({ page }) => {
  await registerAndOnboard(page);

  await page.goto('/track/vitals');
  await page.locator('#v-type').selectOption('GLUCOSE');
  await page.locator('#v-value').fill('45'); // < 54 mg/dL → severe hypoglycemia
  await page.getByRole('button', { name: /add reading/i }).click();

  const alert = page.getByRole('alert');
  await expect(alert).toContainText(/emergency care/i);
  await expect(alert).toContainText(/very low/i);
});
