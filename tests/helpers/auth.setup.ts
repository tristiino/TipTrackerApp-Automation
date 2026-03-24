import { test as setup, expect } from '@playwright/test';
import { TEST_USER } from '../fixtures/test-data';

/**
 * Global auth setup — runs once before the full test suite.
 * Saves authenticated browser state so individual tests
 * don't need to log in on every run.
 *
 * https://playwright.dev/docs/auth
 */

const authFile = 'tests/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder(/username or email/i).fill(TEST_USER.username);
  await page.getByPlaceholder(/password/i).fill(TEST_USER.password);
  await page.getByRole('button', { name: /log in/i }).click();

  // Wait until we've landed on the dashboard
  await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });

  // Persist the signed-in state
  await page.context().storageState({ path: authFile });
});
