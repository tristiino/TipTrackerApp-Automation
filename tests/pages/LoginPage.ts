import { Page, Locator, expect } from '@playwright/test';

/**
 * LoginPage — Page Object Model
 * Encapsulates all interactions with the TipTrackerApp login screen.
 */
export class LoginPage {
  readonly page: Page;

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByLabel(/username or email/i);
    this.passwordInput = page.getByLabel(/^password$/i);
    this.submitButton = page.getByRole('button', { name: /^login$/i });
    this.errorMessage = page.getByText(/login failed|please check your credentials/i);
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string | RegExp) {
    await expect(this.errorMessage).toContainText(message);
  }
}
