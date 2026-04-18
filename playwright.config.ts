import { defineConfig, devices } from '@playwright/test';

/**
 * TipTrackerApp Playwright Configuration
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
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
    /* Apple: latest (iPhone 15 Pro) + most popular (iPhone 14) */
    {
      name: 'iphone-15-pro',
      use: { ...devices['iPhone 15 Pro'], storageState: 'tests/.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'iphone-14',
      use: { ...devices['iPhone 14'], storageState: 'tests/.auth/user.json' },
      dependencies: ['setup'],
    },
    /* Android: latest (Galaxy S24) + most popular (Galaxy A55) */
    {
      name: 'galaxy-s24',
      use: { ...devices['Galaxy S24'], storageState: 'tests/.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'galaxy-a55',
      use: { ...devices['Galaxy A55'], storageState: 'tests/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});
