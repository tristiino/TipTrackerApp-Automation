import { test, expect } from '../fixtures/auth-test';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Navigation & UX test suite
 * Sprint 4 — P1-019 through P1-022
 * Covers: consistent nav structure, Quick Add accessibility, mobile compatibility.
 */

test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Navigation', () => {
  const authenticatedRoutes = ['/dashboard', '/log-tips', '/history', '/settings'];

  test('P1-019: should display navigation links on the dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.navDashboard).toBeVisible();
    await expect(dashboard.navLogTips).toBeVisible();
    await expect(dashboard.navHistory).toBeVisible();
    await expect(dashboard.navSettings).toBeVisible();
  });

  for (const route of authenticatedRoutes) {
    test(`P1-019: navigation links should be present on ${route}`, async ({ page }) => {
      await page.goto(route);

      const dashboard = new DashboardPage(page);
      await expect(dashboard.navDashboard).toBeVisible();
      await expect(dashboard.navLogTips).toBeVisible();
      await expect(dashboard.navHistory).toBeVisible();
      await expect(dashboard.navSettings).toBeVisible();
    });
  }

  test('P1-019: Dashboard nav link should navigate to /dashboard', async ({ page }) => {
    await page.goto('/history');
    const dashboard = new DashboardPage(page);
    await dashboard.navDashboard.click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('P1-019: Log Tips nav link should navigate to /tip-entry-form', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.navLogTips.click();
    await expect(page).toHaveURL(/tip-entry-form/);
  });

  test('P1-019: History nav link should navigate to /reports', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.navHistory.click();
    await expect(page).toHaveURL(/reports/);
  });

  test('P1-019: Settings nav link should navigate to /settings', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.navSettings.click();
    await expect(page).toHaveURL(/settings/);
  });
});

test.describe('Quick Add Button', () => {
  const authenticatedRoutes = ['/dashboard', '/log-tips', '/history', '/settings'];

  for (const route of authenticatedRoutes) {
    test(`P1-020: Quick Add button should be accessible from ${route}`, async ({ page }) => {
      await page.goto(route);
      const dashboard = new DashboardPage(page);
      await expect(dashboard.quickAddButton).toBeVisible();
    });
  }

  test('P1-020: Quick Add button should open the tip entry form or modal', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.quickAddButton.click();

    // Either navigates to log-tips or opens a modal
    const onLogTipsPage = page.url().includes('log-tips');
    const modalVisible = await page.locator('[role="dialog"], .modal').isVisible();
    expect(onLogTipsPage || modalVisible).toBe(true);
  });
});

test.describe('Mobile Compatibility (P1-022)', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro

  test('should render dashboard without horizontal scroll on mobile', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
  });

  test('should have touch-friendly tap targets (min 44px) for navigation links', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    const navLinks = [dashboard.navDashboard, dashboard.navLogTips, dashboard.navHistory, dashboard.navSettings];
    for (const link of navLinks) {
      if (await link.isVisible()) {
        const box = await link.boundingBox();
        if (box) {
          expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('should render landing page without horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
  });

  test('should render tip entry form without horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/log-tips');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
  });
});
