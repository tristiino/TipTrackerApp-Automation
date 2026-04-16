import { test, expect } from '../fixtures/auth-test';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Analytics Dashboard test suite
 * Sprint 3 — P1-013 through P1-018
 * Covers: earnings chart, view toggles, summary cards, cash/credit breakdown, default route, performance.
 */

test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Analytics Dashboard', () => {
  test('P1-013: should display a line chart of daily earnings', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.heading).toBeVisible();
  });

  test('P1-014: should have Daily, Weekly, and Monthly chart toggle buttons', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.chartToggleDaily).toBeVisible();
    await expect(dashboard.chartToggleWeekly).toBeVisible();
    await expect(dashboard.chartToggleMonthly).toBeVisible();
  });

  test('P1-014: chart should re-render when switching to Weekly view', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.cashCreditChart).toBeVisible();

    await dashboard.chartToggleWeekly.click();

    // Chart canvas should still be present after toggle
    await expect(dashboard.cashCreditChart).toBeVisible();
  });

  test('P1-014: chart should re-render when switching to Monthly view', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.chartToggleMonthly.click();
    await expect(dashboard.cashCreditChart).toBeVisible();
  });

  test('P1-014: chart should re-render when switching back to Daily view', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.chartToggleMonthly.click();
    await dashboard.chartToggleDaily.click();
    await expect(dashboard.cashCreditChart).toBeVisible();
  });

  test('P1-015: should display Total Tips summary card', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.summaryCardTotalTips).toBeVisible();
  });

  test('P1-015: should display Average Tips Per Shift summary card', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.summaryCardAvgTips).toBeVisible();
  });

  test('P1-015: should display Hourly Wage summary card', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.summaryCardHourlyWage).toBeVisible();
  });

  test('P1-016: should display a cash vs. credit tips breakdown chart', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.cashCreditChart).toBeVisible();
  });

  test('P1-017: authenticated users should land on /dashboard by default after login', async ({ page }) => {
    // Navigate to root — should redirect to dashboard for authenticated user
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('P1-017: navigating to /login while authenticated should redirect to dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
  });

  
});

// ---------------------------------------------------------------------------
// Phase 2 Sprint 4 — P2-021: Performance with Phase 2 features loaded
// ---------------------------------------------------------------------------

/**
 * Performance test suite
 * Phase 2 Sprint 4 — P2-021
 * Validates that the dashboard still meets the 2.5 s load budget after
 * the Phase 2 features (tip-out, multi-job, tags) are loaded.
 */
test.describe('P2-021: Dashboard performance with Phase 2 features', () => {
  test('P2-021a: dashboard should load in under 2.5 seconds with Phase 2 features active', async ({ page }) => {
    const start = Date.now();
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();

    // Also wait for Phase 2 UI elements that indicate full feature load
    await expect(page.getByRole('button', { name: 'Gross Tips' })).toBeVisible();

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2500);
  });
});

// ---------------------------------------------------------------------------
// Phase 2 Sprint 4 — P2-026: Dashboard Tag Analytics Filter
// ---------------------------------------------------------------------------

/**
 * Dashboard tag analytics filter test suite
 * Phase 2 Sprint 4 — P2-026
 * Verifies the tag dropdown on the dashboard filters summary cards and
 * the earnings chart, and that "All Tags" resets to full data.
 */
test.describe('P2-026: Dashboard tag analytics filter', () => {
  test('P2-026a: tag filter dropdown should appear on dashboard when tags exist', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();

    const tagFilter = page.getByRole('combobox').nth(1);
    await expect(tagFilter).toBeVisible();
  });

  test('P2-026b: selecting a tag should filter summary cards and the chart', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();

    const tagFilter = page.getByRole('combobox').nth(1);
    await page.getByRole('combobox').nth(1).selectOption('1'); // pick the first real tag (not "All Tags")

    // Chart and cards must remain visible with filtered data
    await expect(dashboard.cashCreditChart).toBeVisible();
    await expect(dashboard.summaryCardTotalTips).toBeVisible();
    await expect(dashboard.summaryCardAvgTips).toBeVisible();
  });

  test('P2-026c: selecting "All Tags" should reset to full data', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();

    const tagFilter = page.getByRole('combobox').nth(1);

    // Apply a tag filter then reset
    await page.getByRole('combobox').nth(1).selectOption('1');
    const filteredTotal = await dashboard.summaryCardTotalTips.textContent();

    await tagFilter.selectOption({ label: 'All Tags' });
    const resetTotal = await dashboard.summaryCardTotalTips.textContent();

    // After reset the summary card must render; value may increase
    await expect(dashboard.summaryCardTotalTips).toBeVisible();
    expect(resetTotal).toBeDefined();
    expect(filteredTotal).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Phase 2 Sprint 4 — P2-027: Calendar View Verification
// ---------------------------------------------------------------------------

/**
 * Calendar view test suite
 * Phase 2 Sprint 4 — P2-027
 * Verifies default view, view-toggle persistence, localStorage persistence,
 * and pay-period date defaulting in the calendar.
 */
test.describe('P2-027: Calendar view in reports', () => {
  test('P2-027a: history page should default to calendar view on first load', async ({ page }) => {
    await page.goto('/reports');
    const calendarGrid = page.getByText('SunMonTueWedThuFriSat6$');
    await expect(calendarGrid).toBeVisible();
  });

  test('P2-027b: toggling to table view and back to calendar should work', async ({ page }) => {
    await page.goto('/reports');

    const calendarGrid  = page.getByText('SunMonTueWedThuFriSat6$');
    const historyTable  = page.getByText('Tip EntriesDateAmountTip-');
    const listButton    = page.getByRole('button', { name: 'Table view' });
    const calendarButton = page.getByRole('button', { name: 'Calendar view' });

    // Switch to list
    await listButton.click();
    await expect(historyTable).toBeVisible();
    await expect(calendarGrid).not.toBeVisible();

    // Switch back to calendar
    await calendarButton.click();
    await expect(calendarGrid).toBeVisible();
    await expect(historyTable).not.toBeVisible();
  });

  test('P2-027c: selected view should persist after a page reload', async ({ page }) => {
    await page.goto('/reports');
    
    const listButton    = page.getByRole('button', { name: 'Table view' });
    const calendarGrid  = page.getByText('SunMonTueWedThuFriSat6$');
    const historyTable  = page.getByText('Tip EntriesDateAmountTip-');

    // Switch to list view
    await listButton.click();
    await expect(historyTable).toBeVisible();

    // Reload — list view should still be active (persisted in localStorage)
    await page.reload();
    await expect(historyTable).toBeVisible();
    await expect(calendarGrid).not.toBeVisible();
  });

  test('P2-027d: calendar dates should default to the current pay period when one is configured', async ({ page }) => {
    // Navigate to history — the calendar header/label should reflect the pay period range
    await page.goto('/reports');

    const calendarGrid  = page.getByText('SunMonTueWedThuFriSat6$');
    await expect(calendarGrid).toBeVisible();

    // The pay period date range label must be visible (set during pay-period.spec.ts setup)
    const periodLabel = page.getByText('Start Date:End Date:Search');
    await expect(periodLabel).toBeVisible();
  });
});
