import { Page, Locator, expect } from '@playwright/test';

/**
 * SettingsPage — Page Object Model
 * Encapsulates interactions with the user settings page.
 *
 * Sections:
 *   - Pay Period  — ad-hoc feature (2026-03-30)
 *   - Tip-Out Roles — Phase 2 Sprint 1 (P2-001)
 *   - Job Profiles  — Phase 2 Sprint 2 (P2-007)
 */
export class SettingsPage {
  readonly page: Page;

  // --- Pay Period ---
  readonly payPeriodStartInput: Locator;
  readonly payPeriodLengthCycle: Locator;
  readonly saveButton: Locator;
  readonly resetButton: Locator;

  // --- Tip-Out Roles (P2-001) ---
  readonly tipOutTab: Locator;
  readonly addRoleButton: Locator;
  readonly roleNameInput: Locator;
  readonly roleTypeSelect: Locator;
  readonly roleAmountPercent: Locator;
  readonly roleAmountFixed: Locator;
  readonly saveRoleButton: Locator;
  readonly roleList: Locator;
  readonly overLimitError: Locator;
  readonly deleteRoleButton: Locator;
  readonly roleTypeFixed: Locator;
  readonly roleTypePercent: Locator;
  readonly applyJob: Locator;

  // --- Job Profiles (P2-007) ---
  readonly noJobCard: Locator;
  readonly jobTab: Locator;
  readonly addJobButton: Locator;
  readonly jobNameInput: Locator;
  readonly jobLocationInput: Locator;
  readonly jobHourlyRateInput: Locator;
  readonly saveJobButton: Locator;
  readonly primaryJob: Locator;
  readonly jobLimitError: Locator;
  readonly editJobButton: Locator;
  readonly deleteJobButton: Locator;
  readonly deleteJobButtons: Locator;
  readonly confirmDeleteButton: Locator;
  readonly updateJobButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Pay Period
    this.payPeriodStartInput = page.locator('#payPeriodStartAnchor');
    this.payPeriodLengthCycle   = page.locator('#payPeriodLengthDays');
    this.saveButton          = page.getByRole('button', { name: 'Save Settings' });
    this.resetButton         = page.getByRole('button', { name: 'Reset' });

    // Tip-Out Roles
    this.tipOutTab       = page.getByRole('button', { name: 'Tip-Outs' });
    this.addRoleButton   = page.getByRole('button', { name: '+ Add Tip-Out Role' });
    this.roleNameInput   = page.getByLabel(/role name/i);
    this.roleTypeSelect  = page.getByLabel(/role type/i);
    this.roleAmountPercent = page.getByRole('spinbutton', { name: 'Amount (% of gross tips)' });
    this.roleAmountFixed = page.getByRole('spinbutton', { name: 'Amount ($ per shift)' });
    this.saveRoleButton  = page.getByRole('button', { name: 'Add Role' });
    this.roleList        = page.locator('[data-testid="tip-out-role-list"]');
    this.overLimitError  = page.getByText('This would push your total');
    this.deleteRoleButton = page.getByRole('button', { name: 'Delete' }).first();
    this.roleTypeFixed = page.getByText('Fixed dollar amount');
    this.roleTypePercent = page.getByText('Percentage of gross');
    this.applyJob = page.getByRole('combobox');

    // Job Profiles
    this.noJobCard       = page.getByText('No jobs yet. Add your first');
    this.jobTab          = page.getByRole('button', { name: 'Jobs' });
    this.addJobButton        = page.getByRole('button', { name: '+ Add Job' });
    this.jobNameInput        = page.getByLabel(/job name/i);
    this.jobLocationInput    = page.getByLabel(/location/i);
    this.jobHourlyRateInput  = page.getByRole('spinbutton', { name: 'Hourly wage (optional)' });
    this.saveJobButton       = page.getByRole('button', { name: 'Add Job' });
    this.primaryJob          = page.getByText('The Rooftop');
    this.jobLimitError       = page.getByText('Maximum of 10 jobs reached.');
    this.editJobButton       = page.getByRole('button', { name: /edit/i }).first();
    this.deleteJobButton     = page.getByRole('button', { name: 'Delete' });
    this.deleteJobButtons    = page.getByRole('button', { name: 'Delete' }).first();
    this.confirmDeleteButton = page.getByRole('button', { name: /confirm/i });
    this.updateJobButton     = page.getByRole('button', { name: 'Update Job' });
  }

  async goto() {
    await this.page.goto('/settings');
    await expect(this.page).toHaveURL(/settings/);
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/settings/);
  }

  // --- Pay Period helpers ---

  async savePayPeriod(startDate: string, endDate: string) {
    await this.payPeriodStartInput.fill(startDate);
    
    await this.saveButton.click();
  }

  // --- Tip-Out Role helpers ---

  /**
   * Creates a tip-out role via the Settings form.
   * @param name   Display name for the role (e.g. 'Busser')
   * @param type   'percent' | 'fixed'
   * @param amount Numeric value (percent or dollar)
   */
  async createRole(name: string, type: 'percent' | 'fixed', amount: number) {
    await this.addRoleButton.click();
    await this.roleNameInput.fill(name);
    
    if (type === 'fixed') {
      await this.roleTypeFixed.click();
      await this.roleAmountFixed.fill(String(amount));
    } else {
      await this.roleTypePercent.click();
      await this.roleAmountPercent.fill(String(amount));
    }
    
    if (await this.overLimitError.isVisible()) {
      console.warn('[createRole] Over-limit warning: tip-out splits exceed 100%, save button disabled');
    } else {
      await this.saveRoleButton.click();
    }
  }

  // --- Job Profile helpers ---

  /**
   * Creates a job profile via the Settings form.
   * @param name       Job display name
   * @param location   Physical location string
   * @param hourlyRate Numeric hourly wage
   */
  async createJob(name: string, location: string, hourlyRate: number) {
    await this.goto();
    await this.jobTab.click();
    await this.addJobButton.click();
    await this.jobNameInput.fill(name);
    await this.jobLocationInput.fill(location);
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.jobHourlyRateInput.fill(String(hourlyRate));
    await this.saveJobButton.click();
  }

  /** Edits the first job in the list with any provided field updates. */
  async editFirstJob(updates: Partial<{ name: string; location: string; hourlyRate: number }>) {
    await this.editJobButton.click();
    if (updates.name)     await this.jobNameInput.fill(updates.name);
    if (updates.location) await this.jobLocationInput.fill(updates.location);
    if (updates.hourlyRate !== undefined)
      await this.jobHourlyRateInput.fill(String(updates.hourlyRate));
    await this.updateJobButton.click();
  }

  /** Deletes the first job in the list and confirms the dialog. */
  async deleteFirstJob() {
    await this.deleteJobButton.click();
    await this.confirmDeleteButton.click();
  }

  /** Returns the number of job rows currently rendered in the job list. */
  async getJobCount(): Promise<number> {
    return this.primaryJob.locator('[data-testid="job-profile-item"]').count();
  }

  // delete tip out role
  async deleteRole() {
    const noTipRole = this.page.getByText('No tip-out roles yet. Add');
    await this.page.waitForTimeout(1000);

    if (await noTipRole.isHidden()) {
      this.page.once('dialog', dialog => dialog.accept());
      await this.deleteRoleButton.click();
      await this.page.waitForTimeout(2000);
    }
  }

  /** Navigates to the tip-out tab and deletes all roles one by one. */
  async deleteAllRoles() {
    await this.goto();
    await this.tipOutTab.click();
    await this.page.waitForLoadState('networkidle');

    while (await this.deleteRoleButton.isVisible()) {
      this.page.once('dialog', dialog => dialog.accept());
      await this.deleteRoleButton.click();
      await this.page.waitForTimeout(2000);
    }
  }

  async deleteJob() {
    while (await this.deleteJobButton.isVisible()) {
      this.page.once('dialog', dialog => dialog.accept());
      await this.deleteJobButton.click();
      await this.page.waitForTimeout(2000);
    }
  }

  async deleteAllJobs() {
    await this.goto();
    await this.jobTab.click();
    await this.page.waitForLoadState('networkidle');

    while (await this.deleteJobButtons.isVisible()) {
      this.page.once('dialog', dialog => dialog.accept());
      await this.deleteJobButtons.click();
      await this.page.waitForTimeout(500);
    }
  }

  async createRoleTip(name: string, type: 'percent' | 'fixed', amount: number) {
    await this.addRoleButton.click();
    await this.roleNameInput.fill(name);
    
    if (type === 'fixed') {
      await this.roleTypeFixed.click();
      await this.roleAmountFixed.fill(String(amount));
    } else {
      await this.roleTypePercent.click();
      await this.roleAmountPercent.fill(String(amount));
    }
    
    if (await this.overLimitError.isVisible()) {
      console.warn('[createRole] Over-limit warning: tip-out splits exceed 100%, save button disabled');
    } else {
      await this.applyJob.selectOption({ label: 'The Rooftop' });
      await this.saveRoleButton.click();
    }
  }

} 
