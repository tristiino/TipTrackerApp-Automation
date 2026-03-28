import { Page, Locator, expect } from '@playwright/test';

/**
 * DashboardPage — Page Object Model
 * Encapsulates all interactions with the main dashboard.
 */
export class DashboardPage {
  readonly page: Page;

  readonly heading: Locator;
  readonly addShiftButton: Locator;
  readonly shiftTable: Locator;
  readonly logoutButton: Locator;
  readonly graph: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /earnings/i });
    this.addShiftButton = page.getByRole('button', { name: /quick add tip/i });
    this.shiftTable = page.getByRole('table');
    this.logoutButton = page.locator('a.logout-link');
    this.graph = page.locator('canvas').first();
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dashboard/);
    await expect(this.heading).toBeVisible();
  }

  async logout() {
    if (await this.logoutButton.isVisible()) {
      await this.logoutButton.click();
    } else {
      // On mobile the nav logout is hidden — use the settings page instead
      await this.page.goto('/settings');
      await this.page.getByRole('button', { name: /^logout$/i }).click();
    }
    await expect(this.page).toHaveURL(/login|home|\//);
  }
}
