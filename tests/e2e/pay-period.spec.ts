import { test, expect } from '../fixtures/auth-test';
import { DashboardPage } from '../pages/DashboardPage';
import { SettingsPage } from '../pages/SettingsPage';

/**
 * Pay Period Dashboard Mode test suite
 * Ad-hoc feature — implemented 2026-03-30
 * Covers: Settings configuration, dashboard Pay Period toggle, no-period notice,
 * chart load with a configured period, and interop with existing Daily/Weekly/Monthly toggles.
 */

test.use({ storageState: 'tests/.auth/user.json' });

// Reusable pay period fixture within the current test's billing window
const PAY_PERIOD = {
  startDate: '2026-03-23',
  endDate: '2026-04-05',
};

// ---------------------------------------------------------------------------
// Settings — Pay Period configuration
// ---------------------------------------------------------------------------

test.describe('Settings — Pay Period configuration', () => {
  test('AD-001: should display pay period start and end date inputs', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.expectLoaded();

    await expect(settings.payPeriodStartInput).toBeVisible();
    await expect(settings.payPeriodEndInput).toBeVisible();
  });

  test('AD-001: should display save and reset buttons on the settings page', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    await expect(settings.saveButton).toBeVisible();
    await expect(settings.resetButton).toBeVisible();
  });

  test('AD-001: should persist pay period to localStorage after saving', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.savePayPeriod(PAY_PERIOD.startDate, PAY_PERIOD.endDate);

    const stored = await page.evaluate(() => localStorage.getItem('payPeriod'));
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.startDate).toBe(PAY_PERIOD.startDate);
    expect(parsed.endDate).toBe(PAY_PERIOD.endDate);
  });

  test('AD-001: should clear pay period from localStorage after reset', async ({ page }) => {
    // Pre-seed a period so reset has something to clear
    await page.goto('/settings');
    await page.evaluate((pp) => localStorage.setItem('payPeriod', JSON.stringify(pp)), PAY_PERIOD);

    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.resetButton.click();

    const stored = await page.evaluate(() => localStorage.getItem('payPeriod'));
    expect(stored).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Dashboard — Pay Period toggle visibility and default state
// ---------------------------------------------------------------------------

test.describe('Dashboard — Pay Period toggle', () => {
  test('AD-002: should display the Pay Period toggle button', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.chartTogglePayPeriod).toBeVisible();
  });

  test('AD-002: Pay Period button should appear before Daily, Weekly, and Monthly buttons', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Verify order: Pay Period is leftmost by checking DOM position
    const buttons = page.getByRole('button', { name: /^(pay period|daily|weekly|monthly)$/i });
    const texts = await buttons.allInnerTexts();
    expect(texts[0].toLowerCase()).toBe('pay period');
  });
});

// ---------------------------------------------------------------------------
// Dashboard — No pay period configured
// ---------------------------------------------------------------------------

test.describe('Dashboard — no pay period configured', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any stored pay period before each test in this group
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.removeItem('payPeriod'));
    await page.reload();
  });

  test('AD-003: should show the "no pay period set" notice when none is configured', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.chartTogglePayPeriod.click();

    await expect(dashboard.noPayPeriodNotice).toBeVisible();
  });

  test('AD-003: notice should contain a link to the Settings page', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.chartTogglePayPeriod.click();

    await expect(dashboard.noPayPeriodSettingsLink).toBeVisible();
  });

  test('AD-003: Settings link in notice should navigate to /settings', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.chartTogglePayPeriod.click();
    await dashboard.noPayPeriodSettingsLink.click();

    await expect(page).toHaveURL(/settings/);
  });
});

// ---------------------------------------------------------------------------
// Dashboard — Pay period configured
// ---------------------------------------------------------------------------

test.describe('Dashboard — pay period configured', () => {
  test.beforeEach(async ({ page }) => {
    // Seed localStorage before navigating so the dashboard reads it on init
    await page.goto('/dashboard');
    await page.evaluate((pp) => localStorage.setItem('payPeriod', JSON.stringify(pp)), PAY_PERIOD);
    await page.reload();
  });

  test('AD-004: should not show the "no pay period" notice when a period is configured', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.chartTogglePayPeriod.click();

    await expect(dashboard.noPayPeriodNotice).not.toBeVisible();
  });

  test('AD-004: earnings chart should be visible in Pay Period mode', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.chartTogglePayPeriod.click();

    await expect(dashboard.cashCreditChart).toBeVisible();
  });

  test('AD-004: time range sub-tabs should be hidden in Pay Period mode', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.chartTogglePayPeriod.click();

    // The rolling-window sub-tabs (7 Days, 2 Weeks, 30 Days, etc.) should not be visible
    const timeRangeTabs = page.locator('.time-range-tabs, [data-testid="time-range-tabs"]');
    await expect(timeRangeTabs).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Dashboard — Toggle interop (Pay Period ↔ Daily / Weekly / Monthly)
// ---------------------------------------------------------------------------

test.describe('Dashboard — Pay Period toggle interop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((pp) => localStorage.setItem('payPeriod', JSON.stringify(pp)), PAY_PERIOD);
    await page.reload();
  });

  test('AD-005: switching from Pay Period to Daily should show the chart', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.chartTogglePayPeriod.click();
    await dashboard.chartToggleDaily.click();

    await expect(dashboard.cashCreditChart).toBeVisible();
  });

  test('AD-005: switching from Pay Period to Weekly should show the chart', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.chartTogglePayPeriod.click();
    await dashboard.chartToggleWeekly.click();

    await expect(dashboard.cashCreditChart).toBeVisible();
  });

  test('AD-005: switching from Daily back to Pay Period should load pay period data', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.chartToggleDaily.click();
    await dashboard.chartTogglePayPeriod.click();

    // With a configured period the chart should render; no notice expected
    await expect(dashboard.noPayPeriodNotice).not.toBeVisible();
    await expect(dashboard.cashCreditChart).toBeVisible();
  });
});
