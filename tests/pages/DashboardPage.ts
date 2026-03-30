import { Page, Locator, expect } from '@playwright/test';

/**
 * DashboardPage — Page Object Model
 * Encapsulates all interactions with the main dashboard.
 * Covers Sprint 3 analytics stories: P1-013 through P1-018.
 */
export class DashboardPage {
  readonly page: Page;

  readonly heading: Locator;
  readonly addShiftButton: Locator;
  readonly shiftTable: Locator;
  readonly logoutButton: Locator;

  // Analytics — Sprint 3
  readonly chartToggleDaily: Locator;
  readonly chartToggleWeekly: Locator;
  readonly chartToggleMonthly: Locator;
  readonly summaryCardTotalTips: Locator;
  readonly summaryCardAvgTips: Locator;
  readonly summaryCardHourlyWage: Locator;
  readonly cashCreditChart: Locator;

  // Pay Period — Ad-Hoc 2026-03-30
  readonly chartTogglePayPeriod: Locator;
  readonly noPayPeriodNotice: Locator;
  readonly noPayPeriodSettingsLink: Locator;

  // Navigation — Sprint 4
  readonly navDashboard: Locator;
  readonly navLogTips: Locator;
  readonly navHistory: Locator;
  readonly navSettings: Locator;
  readonly quickAddButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /earnings/i });
    this.addShiftButton = page.getByRole('button', { name: /quick add tip/i });
    this.shiftTable = page.getByRole('table');
    this.logoutButton = page.locator('a.logout-link');

    // Pay Period
    this.chartTogglePayPeriod = page.getByRole('button', { name: /^pay period$/i });
    this.noPayPeriodNotice = page.locator('.no-pay-period');
    this.noPayPeriodSettingsLink = page.locator('.no-pay-period').getByRole('link', { name: /settings/i });

    // Analytics
    this.chartToggleDaily = page.getByRole('button', { name: /^daily$/i });
    this.chartToggleWeekly = page.getByRole('button', { name: /^weekly$/i });
    this.chartToggleMonthly = page.getByRole('button', { name: /^monthly$/i });
    this.summaryCardTotalTips = page.locator('[data-testid="card-total-earnings"], .summary-card').filter({ hasText: /total tips/i });
    this.summaryCardAvgTips = page.locator('[data-testid="card-avg-tips"], .summary-card').filter({ hasText: /average|avg/i });
    this.summaryCardHourlyWage = page.locator('[data-testid="card-hourly-wage"], .summary-card').filter({ hasText: /hourly|per hour/i });
    this.cashCreditChart = page.locator('[data-testid="cash-credit-chart"], canvas').nth(1);

    // Navigation — use list order, not accessible name: on viewports ≤768px the app hides
    this.navDashboard = page.locator('ul.navbar-links > li > a').nth(0);
    this.navLogTips = page.locator('ul.navbar-links > li > a').nth(1);
    this.navHistory = page.locator('ul.navbar-links > li > a').nth(2);
    this.navSettings = page.locator('ul.navbar-links > li > a').nth(3);
    this.quickAddButton = page.getByRole('button', { name: /quick add tip/i });
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
