import { Page, Locator, expect } from '@playwright/test';

/**
 * JobProfilePage — Page Object Model
 * Encapsulates interactions with the multi-job profile features:
 *   - Job CRUD in Settings (/settings#jobs)
 *   - Job selector dropdown on the tip entry form
 *   - Per-job filter on the dashboard and history page
 * Covers Phase 2 Sprint 2 stories: P2-007 through P2-012, P2-020.
 */
export class JobProfilePage {
  readonly page: Page;

  // --- Settings: Job Profile Management ---
  readonly addJobButton: Locator;
  readonly jobNameInput: Locator;
  readonly jobLocationInput: Locator;
  readonly jobHourlyRateInput: Locator;
  readonly saveJobButton: Locator;
  readonly jobList: Locator;
  readonly jobLimitError: Locator;
  readonly editJobButton: Locator;
  readonly deleteJobButton: Locator;
  readonly confirmDeleteButton: Locator;

  // --- Tip Entry Form: Job Selector ---
  readonly jobSelectorDropdown: Locator;

  // --- Dashboard / History: Per-Job Filter ---
  readonly jobFilterDropdown: Locator;
  readonly allJobsOption: Locator;

  constructor(page: Page) {
    this.page = page;

    // Settings job form
    this.addJobButton       = page.getByRole('button', { name: /add job/i });
    this.jobNameInput       = page.getByLabel(/job name/i);
    this.jobLocationInput   = page.getByLabel(/location/i);
    this.jobHourlyRateInput = page.getByLabel(/hourly rate/i);
    this.saveJobButton      = page.getByRole('button', { name: /save job/i });
    this.jobList            = page.locator('[data-testid="job-profile-list"]');
    this.jobLimitError      = page.getByText(/maximum of 10 jobs/i);
    this.editJobButton      = page.getByRole('button', { name: /edit/i }).first();
    this.deleteJobButton    = page.getByRole('button', { name: /delete/i }).first();
    this.confirmDeleteButton = page.getByRole('button', { name: /confirm/i });

    // Tip entry form
    this.jobSelectorDropdown = page.getByLabel(/select job/i);

    // Shared filter (dashboard + history)
    this.jobFilterDropdown = page.locator('[data-testid="job-filter"]');
    this.allJobsOption     = page.getByRole('option', { name: /all jobs/i });
  }

  /** Navigate to the jobs section in settings. */
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

  /** Navigate to the shift history page. */
  async gotoHistory() {
    await this.page.goto('/history');
    await expect(this.page).toHaveURL(/history/);
  }

  /**
   * Creates a job profile via the Settings form.
   * @param name       Job display name
   * @param location   Physical location string
   * @param hourlyRate Numeric hourly wage
   */
  async createJob(name: string, location: string, hourlyRate: number) {
    await this.addJobButton.click();
    await this.jobNameInput.fill(name);
    await this.jobLocationInput.fill(location);
    await this.jobHourlyRateInput.fill(String(hourlyRate));
    await this.saveJobButton.click();
  }

  /**
   * Edits the first job in the list.
   * Opens the edit form and replaces every provided field.
   */
  async editFirstJob(updates: Partial<{ name: string; location: string; hourlyRate: number }>) {
    await this.editJobButton.click();
    if (updates.name)       await this.jobNameInput.fill(updates.name);
    if (updates.location)   await this.jobLocationInput.fill(updates.location);
    if (updates.hourlyRate !== undefined)
      await this.jobHourlyRateInput.fill(String(updates.hourlyRate));
    await this.saveJobButton.click();
  }

  /** Deletes the first job in the list and confirms the dialog. */
  async deleteFirstJob() {
    await this.deleteJobButton.click();
    await this.confirmDeleteButton.click();
  }

  /** Returns the number of job rows currently rendered in the job list. */
  async getJobCount(): Promise<number> {
    return this.jobList.locator('[data-testid="job-profile-item"]').count();
  }

  /** Selects a job filter by name on the current page (dashboard or history). */
  async selectJobFilter(jobName: string) {
    await this.jobFilterDropdown.selectOption(jobName);
  }

  /** Resets the job filter to 'All Jobs'. */
  async resetJobFilter() {
    await this.jobFilterDropdown.selectOption({ label: 'All Jobs' });
  }
}
