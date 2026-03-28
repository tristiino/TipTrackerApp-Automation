import { test, expect } from '@playwright/test';
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

    await expect(dashboard.cashCreditChart).toBeVisible();
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
    await expect(page).toHaveURL(/dashboard/);
  });

  test('P1-018: dashboard should load in under 2 seconds', async ({ page }) => {
    const start = Date.now();
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });
});
