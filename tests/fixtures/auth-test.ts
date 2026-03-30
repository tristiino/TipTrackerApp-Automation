import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';

const sessionFile = 'tests/.auth/session.json';

/**
 * Custom test fixture for authenticated tests.
 *
 * Playwright's storageState only captures localStorage and cookies — it does
 * not capture sessionStorage. The app stores its JWT in sessionStorage, so
 * we use addInitScript to inject the token before Angular initialises on
 * every page navigation.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    if (fs.existsSync(sessionFile)) {
      const session: Record<string, string> = JSON.parse(
        fs.readFileSync(sessionFile, 'utf-8')
      );
      await page.addInitScript((s: Record<string, string>) => {
        for (const [key, value] of Object.entries(s)) {
          if (value) sessionStorage.setItem(key, value);
        }
      }, session);
    }
    await use(page);
  },
});

export { expect };
