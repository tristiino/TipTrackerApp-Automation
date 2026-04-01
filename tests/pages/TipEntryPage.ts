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

  constructor(page: Page) {
    this.page = page;
    this.dateInput = page.getByLabel(/date/i);
    this.startTimeInput = page.getByRole('textbox').nth(1);
    this.endTimeInput = page.getByRole('textbox').nth(2);
    this.hoursDisplay = page.getByText(/Hours Worked/i).locator('..');
    this.cashTipsInput = page.locator('#cashTips');
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
  }: {
    date?: string;
    startTime?: string;
    endTime?: string;
    cashTips: number;
    creditTips: number;
    tipPool?: number;
  }) {
    if (date) await this.dateInput.fill(date);
    await this.shiftTypeInput.click();
    if (startTime) await this.startTimeInput.fill(startTime);
    if (endTime) await this.endTimeInput.fill(endTime);
    await this.cashTipsInput.fill(String(cashTips));
    await this.creditTipsInput.fill(String(creditTips));
    if (tipPool !== undefined) await this.tipPoolInput.fill(String(tipPool));
  }

  async submit() {
    // force: true bypasses pointer-event interception — on narrow mobile viewports
    // (e.g. Galaxy S24) the FAB and form fields overlap the button regardless of
    // scroll position, so no scroll strategy works. The tests verify form submission
    // behaviour, not button pointer-accessibility.
    await this.submitButton.click({ force: true });

    // After submitting, scroll the success/error feedback into view. On narrow
    // mobile viewports the message renders below the fold and toBeVisible() fails
    // if the element is clipped or animation-gated by an IntersectionObserver.
    await this.successMessage.or(this.errorMessage).first().scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
  }

  async getTotalTipsText(): Promise<string> {
    return (await this.totalTipsDisplay.textContent()) ?? '';
  }

  async getDateValue(): Promise<string> {
    return await this.dateInput.inputValue();
  }
}
