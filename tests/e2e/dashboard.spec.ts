import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Dashboard test suite
 * Covers: page load, key UI elements, and navigation.
 *
 * Tests here run with the authenticated state saved by auth.setup.ts.
 */

test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Dashboard', () => {
  test('should load dashboard after login', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectLoaded();
  });

  test('should display the Add Shift button', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.addShiftButton).toBeVisible();
  });

  test('should display the graph', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.graph).toBeVisible();
  });
  // TODO: Add shift entry tests in Sprint 1
  // TODO: Add tip summary / analytics tests in Sprint 2
});
