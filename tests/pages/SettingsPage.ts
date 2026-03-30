import { Page, Locator, expect } from '@playwright/test';

/**
 * SettingsPage — Page Object Model
 * Encapsulates interactions with the user settings page.
 * Covers the Pay Period configuration section added ad-hoc on 2026-03-30.
 */
export class SettingsPage {
  readonly page: Page;

  // Pay Period fields
  readonly payPeriodStartInput: Locator;
  readonly payPeriodEndInput: Locator;
  readonly saveButton: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.payPeriodStartInput = page.locator('#payPeriodStart');
    this.payPeriodEndInput = page.locator('#payPeriodEnd');
    this.saveButton = page.getByRole('button', { name: 'Save Settings' });
    this.resetButton = page.getByRole('button', { name: 'Reset' });
  }

  async goto() {
    await this.page.goto('/settings');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/settings/);
  }

  async savePayPeriod(startDate: string, endDate: string) {
    await this.payPeriodStartInput.fill(startDate);
    await this.payPeriodEndInput.fill(endDate);
    await this.saveButton.click();
  }
}
