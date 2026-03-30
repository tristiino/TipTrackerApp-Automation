import { defineConfig, devices } from '@playwright/test';

/**
 * TipTrackerApp Playwright Configuration
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    /* Base URL — override with BASE_URL env var in CI */
    baseURL: process.env.BASE_URL || 'https://tiptrackerapp.org',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    /* --- Setup: runs auth before any tests --- */
    { name: 'setup', testMatch: /.*\.setup\.ts/, testDir: './tests/helpers' },

    /* --- Cross-browser --- */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: 'tests/.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: 'tests/.auth/user.json' },
      dependencies: ['setup'],
    },

    /* --- Mobile viewports --- */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'], storageState: 'tests/.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'], storageState: 'tests/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});
