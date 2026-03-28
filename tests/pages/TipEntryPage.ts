import { Page, Locator, expect } from '@playwright/test';

/**
 * TipEntryPage — Page Object Model
 * Encapsulates all interactions with the tip/shift entry form.
 * Covers Sprint 2 stories: P1-007 through P1-012.
 */
export class TipEntryPage {
  readonly page: Page;

  readonly dateInput: Locator;
  readonly startTimeInput: Locator;
  readonly endTimeInput: Locator;
  readonly hoursDisplay: Locator;
  readonly cashTipsInput: Locator;
  readonly creditTipsInput: Locator;
  readonly totalTipsDisplay: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dateInput = page.getByLabel(/date/i);
    this.startTimeInput = page.getByLabel(/start time/i);
    this.endTimeInput = page.getByLabel(/end time/i);
    this.hoursDisplay = page.locator('[data-testid="hours-worked"], .hours-worked, [aria-label*="hours"]').first();
    this.cashTipsInput = page.getByLabel(/cash tips/i);
    this.creditTipsInput = page.getByLabel(/credit(?: card)? tips/i);
    this.totalTipsDisplay = page.locator('[data-testid="total-tips"], .total-tips, [aria-label*="total"]').first();
    this.submitButton = page.getByRole('button', { name: /save|submit|add shift/i });
    this.successMessage = page.getByText(/shift saved|entry added|success/i);
    this.errorMessage = page.locator('[data-testid="form-error"], .error-message, [role="alert"]').first();
  }

  async goto() {
    await this.page.goto('/log-tips');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/log-tips|add-shift|entry/i);
    await expect(this.cashTipsInput).toBeVisible();
    await expect(this.creditTipsInput).toBeVisible();
  }

  async fillShift({
    date,
    startTime,
    endTime,
    cashTips,
    creditTips,
  }: {
    date?: string;
    startTime?: string;
    endTime?: string;
    cashTips: number;
    creditTips: number;
  }) {
    if (date) await this.dateInput.fill(date);
    if (startTime) await this.startTimeInput.fill(startTime);
    if (endTime) await this.endTimeInput.fill(endTime);
    await this.cashTipsInput.fill(String(cashTips));
    await this.creditTipsInput.fill(String(creditTips));
  }

  async submit() {
    await this.submitButton.click();
  }

  async getTotalTipsText(): Promise<string> {
    return (await this.totalTipsDisplay.textContent()) ?? '';
  }

  async getDateValue(): Promise<string> {
    return await this.dateInput.inputValue();
  }
}
