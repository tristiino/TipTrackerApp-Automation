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
  readonly tipPoolInput: Locator;
  readonly shiftTypeInput: Locator;
  readonly notesInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dateInput = page.getByLabel(/date/i);
    this.startTimeInput = page.getByRole('textbox').nth(1);
    this.endTimeInput = page.getByRole('textbox').nth(2);
    this.hoursDisplay = page.getByText(/Hours Worked/i).locator('..');
    this.cashTipsInput = page.locator('#cashTips');
    this.notesInput = page.getByLabel(/notes/i);
    this.creditTipsInput = page.locator('#creditTips');
    this.totalTipsDisplay = page.locator('.tip-total-value');
    this.submitButton = page.getByRole('button', { name: 'Submit' });
    this.successMessage = page.getByText('Tip submitted successfully!');
    this.errorMessage = page.getByText('Submission unsuccessful.');
    this.tipPoolInput = page.getByRole('spinbutton', { name: 'Number of People in Tip Pool' });
    this.shiftTypeInput = page.getByRole('button', { name: 'Evening' })
  }

  async goto() {
    await this.page.goto('/tip-entry-form');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/tip-entry-form/i);
    await expect(this.cashTipsInput).toBeVisible();
    await expect(this.creditTipsInput).toBeVisible();
  }

  async fillShift({
    date,
    startTime,
    endTime,
    cashTips,
    creditTips,
    tipPool,
    notes,
  }: {
    date?: string;
    startTime?: string;
    endTime?: string;
    cashTips: number;
    creditTips: number;
    tipPool?: number;
    notes?: string;
  }) {
    if (date) await this.dateInput.fill(date);
    await this.shiftTypeInput.click();
    if (startTime) await this.startTimeInput.fill(startTime);
    if (endTime) await this.endTimeInput.fill(endTime);
    await this.cashTipsInput.fill(String(cashTips));
    await this.creditTipsInput.fill(String(creditTips));
    if (notes) await this.notesInput.fill(notes);
  }

  async submit() {
    const viewport = this.page.viewportSize();
    if (viewport && viewport.width < 600) {
      await this.submitButton.dispatchEvent('click');
    } else {
      await this.submitButton.click({ force: true });
    }
  }

  async getTotalTipsText(): Promise<string> {
    return (await this.totalTipsDisplay.textContent()) ?? '';
  }

  async getDateValue(): Promise<string> {
    return await this.dateInput.inputValue();
  }
}
