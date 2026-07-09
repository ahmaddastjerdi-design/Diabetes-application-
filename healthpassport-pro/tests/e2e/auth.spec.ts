import { test, expect } from '@playwright/test';

const PASSWORD = 'Correct-Horse-9';

test('unauthenticated app routes redirect to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});

test('register -> onboarding gate -> dashboard', async ({ page }) => {
  const email = `e2e_${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /create account/i }).click();

  // New users must complete onboarding before the dashboard.
  await expect(page).toHaveURL(/\/onboarding/);

  await page.locator('#givenName').fill('Sam');
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByRole('button', { name: /finish setup/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/welcome back/i)).toBeVisible();
});
