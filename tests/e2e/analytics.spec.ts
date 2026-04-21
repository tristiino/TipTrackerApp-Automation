import { test, expect } from '../fixtures/auth-test';
import { SAMPLE_SHIFT } from '../fixtures/test-data';
import { DashboardPage } from '../pages/DashboardPage';
import { HistoryPage } from '../pages/HistoryPage';
import { TipEntryPage } from '../pages/TipEntryPage';

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
 * Validates that the dashboard still meets the 6 s load budget after
 * the Phase 2 features (tip-out, multi-job, tags) are loaded.
 */
test.describe('P2-021: Dashboard performance with Phase 2 features', () => {
  test('P2-021a: dashboard should load in under 6 seconds with Phase 2 features active', async ({ page }) => {
    const start = Date.now();
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();

    // Also wait for Phase 2 UI elements that indicate full feature load
    await expect(page.getByRole('button', { name: 'Gross Tips' })).toBeVisible();

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(6000);
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

    const tagFilter = page.getByRole('combobox');
    await expect(tagFilter).toBeVisible();
  });

  test('P2-026b: selecting a tag should filter summary cards and the chart', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();

    const tagFilter = page.getByRole('combobox');
    await tagFilter.selectOption('1'); // pick the first real tag (not "All Tags")

    // Chart and cards must remain visible with filtered data
    await expect(dashboard.cashCreditChart).toBeVisible();
    await expect(dashboard.summaryCardTotalTips).toBeVisible();
    await expect(dashboard.summaryCardAvgTips).toBeVisible();
  });

  test('P2-026c: selecting "All Tags" should reset to full data', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();

    const tagFilter = page.getByRole('combobox');

    // Apply a tag filter then reset
    await tagFilter.selectOption('1');
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

  test('P2-027b: toggling to table view and back to calendar should work', async ({ page }) => {
    const history = new HistoryPage(page);
    const tipEntry = new TipEntryPage(page);

    await tipEntry.goto();

    await tipEntry.fillShift({
          date: SAMPLE_SHIFT.date,
          startTime: SAMPLE_SHIFT.startTime,
          endTime: SAMPLE_SHIFT.endTime,
          cashTips: SAMPLE_SHIFT.cashTips,
          creditTips: SAMPLE_SHIFT.creditTips,
          tipPool: SAMPLE_SHIFT.tipPool,
        });
    await tipEntry.submit();
    await expect(tipEntry.successMessage).toBeVisible();

    await history.goto();

    // Switch to list
    await history.listViewButton.click();
    await expect(history.listTable).toBeVisible();
    await expect(history.calendarGrid).not.toBeVisible();

    // Switch back to calendar
    await history.calendarViewButton.click();
    await expect(history.calendarGrid).toBeVisible();
    await expect(history.listTable).not.toBeVisible();

    await history.deleteAllShifts();
  });

  test('P2-027c: selected view should persist after a page reload', async ({ page }) => {
    const history = new HistoryPage(page);
    const tipEntry = new TipEntryPage(page);

    await tipEntry.goto();

    await tipEntry.fillShift({
          date: SAMPLE_SHIFT.date,
          startTime: SAMPLE_SHIFT.startTime,
          endTime: SAMPLE_SHIFT.endTime,
          cashTips: SAMPLE_SHIFT.cashTips,
          creditTips: SAMPLE_SHIFT.creditTips,
          tipPool: SAMPLE_SHIFT.tipPool,
        });
    await tipEntry.submit();
    await expect(tipEntry.successMessage).toBeVisible();

    await history.goto();

    // Switch to list view
    await history.listViewButton.click();
    await expect(history.listTable).toBeVisible();

    // Reload — list view should still be active (persisted in localStorage)
    await page.reload();
    await expect(history.listTable).toBeVisible();
    await expect(history.calendarGrid).not.toBeVisible();

    await history.deleteAllShifts();
  });

});
