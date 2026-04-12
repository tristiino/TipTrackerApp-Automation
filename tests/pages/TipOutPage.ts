import { Page, Locator, expect } from '@playwright/test';

/**
 * TipOutPage — Page Object Model
 * Encapsulates interactions with the tip-out calculator features:
 *   - Role CRUD in Settings (/settings#tip-out)
 *   - Template selector on the tip entry form
 *   - Net/gross toggle on the dashboard
 * Covers Phase 2 Sprint 1 stories: P2-001 through P2-006, P2-019.
 */
export class TipOutPage {
  readonly page: Page;

  // --- Settings: Tip-Out Role Management ---
  readonly addRoleButton: Locator;
  readonly roleNameInput: Locator;
  readonly roleTypeSelect: Locator;
  readonly roleAmountInput: Locator;
  readonly saveRoleButton: Locator;
  readonly roleList: Locator;
  readonly overLimitError: Locator;

  // --- Tip Entry Form: Template Selector ---
  readonly tipOutTemplateDropdown: Locator;
  readonly tipOutDeductionDisplay: Locator;
  readonly netTipsDisplay: Locator;
  readonly grossTipsDisplay: Locator;
  readonly overrideInput: Locator;
  readonly overrideBadge: Locator;

  // --- Dashboard: Gross / Net Toggle ---
  readonly grossNetToggle: Locator;
  readonly grossNetToggleNet: Locator;
  readonly grossNetToggleGross: Locator;

  constructor(page: Page) {
    this.page = page;

    // Settings role form
    this.addRoleButton        = page.getByRole('button', { name: /add role/i });
    this.roleNameInput        = page.getByLabel(/role name/i);
    this.roleTypeSelect       = page.getByLabel(/role type/i);
    this.roleAmountInput      = page.getByLabel(/amount/i);
    this.saveRoleButton       = page.getByRole('button', { name: /save role/i });
    this.roleList             = page.locator('[data-testid="tip-out-role-list"]');
    this.overLimitError       = page.getByText(/splits cannot exceed 100%/i);

    // Tip entry form
    this.tipOutTemplateDropdown = page.getByLabel(/tip.?out template/i);
    this.tipOutDeductionDisplay = page.locator('[data-testid="tip-out-deduction"]');
    this.netTipsDisplay         = page.locator('[data-testid="net-tips"]');
    this.grossTipsDisplay       = page.locator('[data-testid="gross-tips"]');
    this.overrideInput          = page.locator('[data-testid="tip-out-override"]');
    this.overrideBadge          = page.locator('[data-testid="override-badge"]');

    // Dashboard toggle
    this.grossNetToggle      = page.locator('[data-testid="gross-net-toggle"]');
    this.grossNetToggleNet   = page.getByRole('button', { name: /^net$/i });
    this.grossNetToggleGross = page.getByRole('button', { name: /^gross$/i });
  }

  /** Navigate to the tip-out section in settings. */
  async gotoSettings() {
    await this.page.goto('/settings');
    await expect(this.page).toHaveURL(/settings/);
  }

  /** Navigate to the tip entry form. */
  async gotoTipEntry() {
    await this.page.goto('/tip-entry-form');
    await expect(this.page).toHaveURL(/tip-entry-form/);
  }

  /** Navigate to the dashboard. */
  async gotoDashboard() {
    await this.page.goto('/dashboard');
    await expect(this.page).toHaveURL(/dashboard/);
  }

  /**
   * Creates a tip-out role via the Settings form.
   * @param name   Display name for the role (e.g. 'Busser')
   * @param type   'percent' | 'fixed'
   * @param amount Numeric value (percent or dollar)
   */
  async createRole(name: string, type: 'percent' | 'fixed', amount: number) {
    await this.addRoleButton.click();
    await this.roleNameInput.fill(name);
    await this.roleTypeSelect.selectOption(type);
    await this.roleAmountInput.fill(String(amount));
    await this.saveRoleButton.click();
  }

  /**
   * Selects a tip-out template from the dropdown on the tip entry form
   * and waits for the deduction display to update.
   */
  async selectTemplate(templateName: string) {
    await this.tipOutTemplateDropdown.selectOption(templateName);
    await expect(this.tipOutDeductionDisplay).not.toHaveText('—');
  }

  /** Returns the current net tips text from the form display. */
  async getNetTipsText(): Promise<string> {
    return (await this.netTipsDisplay.textContent()) ?? '';
  }

  /** Returns the current deduction amount text. */
  async getDeductionText(): Promise<string> {
    return (await this.tipOutDeductionDisplay.textContent()) ?? '';
  }
}
