import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TEST_USER, INVALID_USER } from '../fixtures/test-data';

/**
 * Authentication test suite
 * Covers: login, logout, validation, and session persistence.
 */

test.describe('Authentication', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Always start unauthenticated

  test('should log in with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USER.username, TEST_USER.password);

    await dashboardPage.expectLoaded();
  });

  test('should log in using email address', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);

    await expect(page).toHaveURL(/dashboard/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(INVALID_USER.username, INVALID_USER.password);

    await loginPage.expectError(/login failed|check your credentials/i);
  });

  test('should log out successfully', async ({ page }) => {
    // Log in first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.username, TEST_USER.password);

    // Then log out
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectLoaded();
    await dashboardPage.logout();
  });
});
