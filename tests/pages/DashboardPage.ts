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

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('link', { name: /^dashboard$/i });
    this.addShiftButton = page.getByRole('button', { name: /quick add tip/i });
    this.shiftTable = page.getByRole('table');
    this.logoutButton = page.locator('a.logout-link');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dashboard/);
    await expect(this.heading).toBeVisible();
  }

  async logout() {
    await this.logoutButton.click();
    await expect(this.page).toHaveURL(/login|home|\//);
  }
}
