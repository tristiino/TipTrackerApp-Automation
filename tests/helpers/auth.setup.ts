import { test as setup, expect } from '@playwright/test';
import { TEST_USER } from '../fixtures/test-data';
import * as fs from 'fs';

const sessionFile = 'tests/.auth/session.json';

/**
 * Global auth setup — runs once before the full test suite.
 * Saves authenticated browser state so individual tests
 * don't need to log in on every run.
 *
 * https://playwright.dev/docs/auth
 */

const authFile = 'tests/.auth/user.json';

setup('authenticate', async ({ page }) => {
  fs.mkdirSync('tests/.auth', { recursive: true });
  await page.goto('/login');

  await page.getByLabel(/username or email/i).fill(TEST_USER.username);
  await page.getByLabel(/^password$/i).fill(TEST_USER.password);
  await page.getByRole('button', { name: /^login$/i }).click();

  // Wait until we've landed on the dashboard
  await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });

  // Wait for all in-flight requests to finish — Angular writes the JWT to
  // localStorage asynchronously after the login API response resolves.
  // Without this, storageState() can snapshot the page before the token lands.
  await page.waitForLoadState('networkidle');

  // Capture sessionStorage — the app stores its JWT here, and Playwright's
  // storageState does not capture sessionStorage, so we save it separately.
  // The auth-test fixture reads this file and injects it via addInitScript.
  const sessionData = await page.evaluate(() => {
    const out: Record<string, string> = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)!;
      out[k] = sessionStorage.getItem(k)!;
    }
    return out;
  });
  fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

  // Seed a default pay period so the dashboard renders the earnings chart
  // rather than the "no pay period configured" notice on every test run.
  await page.evaluate(() =>
    localStorage.setItem('payPeriod', JSON.stringify({ startDate: '2026-03-23', endDate: '2026-04-05' }))
  );

  // Persist localStorage + cookies (JWT lives in sessionStorage — see above)
  await page.context().storageState({ path: authFile });
});
