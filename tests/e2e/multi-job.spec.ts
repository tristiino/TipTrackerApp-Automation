import { test, expect } from '../fixtures/auth-test';
import { SettingsPage } from '../pages/SettingsPage';
import { JobProfilePage } from '../pages/JobProfilePage';
import { TipEntryPage } from '../pages/TipEntryPage';
import { DashboardPage } from '../pages/DashboardPage';
import { HistoryPage } from '../pages/HistoryPage';
import { JOB_PROFILES, SAMPLE_SHIFT, LEGACY_SHIFT } from '../fixtures/test-data';

/**
 * Multi-Job Support test suite
 * Phase 2 Sprint 2 — P2-007 through P2-012
 * Phase 2 Sprint 4 — P2-020 (full E2E integration)
 *
 * Covers: job CRUD, job selector on tip form, history job filter,
 * per-job dashboard analytics, job-scoped tip-out config, migration safety.
 */

test.use({ storageState: 'tests/.auth/user.json' });

// ---------------------------------------------------------------------------
// P2-007 — Job Profile CRUD
// ---------------------------------------------------------------------------
test.describe('P2-007: Job profile management', () => {
  test('P2-007a: should allow creating a job profile with name, location, and hourly rate', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    await settings.jobTab.click();

    while ((await settings.noJobCard.isVisible())) {
      await settings.createJob(
        JOB_PROFILES.primary.name,
        JOB_PROFILES.primary.location,
        JOB_PROFILES.primary.hourlyRate,
      );
    }

    await expect(settings.primaryJob).toContainText(JOB_PROFILES.primary.name);
    await settings.deleteJob();
  });

  test('P2-007b: should block creating more than 10 job profiles', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();


    // Create 10 jobs (some may already exist; the UI should enforce the cap)
    for (let i = 1; i <= 10; i++) {
      await settings.createJob(`Job ${i}`, `Location ${i}`, 8 + i * 0.25);
      await page.waitForTimeout(1000)
    }

    await settings.jobLimitError.scrollIntoViewIfNeeded();
    await expect(settings.jobLimitError).toBeVisible();
    await settings.deleteAllJobs();
  });

  test('P2-007c: should allow editing an existing job profile', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.createJob(
      JOB_PROFILES.primary.name,
      JOB_PROFILES.primary.location,
      JOB_PROFILES.primary.hourlyRate,
    );

    await settings.editFirstJob({ name: 'The Rooftop — Updated' });

    await expect(settings.primaryJob).toContainText('The Rooftop — Updated');
    await settings.deleteJob();
  });
});

// ---------------------------------------------------------------------------
// P2-008 — Job Selector on Tip Entry Form
// ---------------------------------------------------------------------------
test.describe('P2-008: Job selector on tip entry form', () => {
  test('P2-008a: should show a job selector dropdown on the tip entry form', async ({ page }) => {
    const settings = new SettingsPage(page);
    const tipEntry = new TipEntryPage(page);

    await settings.goto();
    await settings.jobTab.click();

    while ((await settings.noJobCard.isVisible())) {
      await settings.createJob(
        JOB_PROFILES.primary.name,
        JOB_PROFILES.primary.location,
        JOB_PROFILES.primary.hourlyRate,
      );
    }

    await expect(settings.primaryJob).toContainText(JOB_PROFILES.primary.name);

    await tipEntry.goto();
    await tipEntry.notesInput.scrollIntoViewIfNeeded();
    await tipEntry.jobSelectorPrimary.selectOption({ label: 'The Rooftop · Downtown' });
    await expect(tipEntry.jobSelectorPrimary.locator('option:checked')).toHaveText('The Rooftop · Downtown');

    await settings.deleteAllJobs();
  });

  test('P2-008b: job selector should default to the most recently used job', async ({ page }) => {
    // Create two jobs; log a shift for the secondary one
    const settings = new SettingsPage(page);
    const tipEntry = new TipEntryPage(page);
    const history = new HistoryPage(page);

    await settings.goto();
    await settings.createJob(
      JOB_PROFILES.primary.name,
      JOB_PROFILES.primary.location,
      JOB_PROFILES.primary.hourlyRate,
    );
    await settings.createJob(
      JOB_PROFILES.secondary.name,
      JOB_PROFILES.secondary.location,
      JOB_PROFILES.secondary.hourlyRate,
    );

    // Log a shift for the secondary job
    await tipEntry.goto();

    await tipEntry.fillShift({
      date: SAMPLE_SHIFT.date,
      startTime: SAMPLE_SHIFT.startTime,
      endTime: SAMPLE_SHIFT.endTime,
      cashTips: SAMPLE_SHIFT.cashTips,
      creditTips: SAMPLE_SHIFT.creditTips,
    });

    await tipEntry.jobSelectorPrimary.click();
    await tipEntry.jobSelectorPrimary.selectOption({ label: 'Brunch Spot · Midtown' });
    await tipEntry.submit();
    await expect(tipEntry.successMessage).toBeVisible();

    await history.goto();
    await history.listViewButton.scrollIntoViewIfNeeded();
    await history.listViewButton.click();
    await expect(history.noTipsFound).toBeHidden();

    // Re-open the form — secondary should still be selected
    await tipEntry.goto();
    await expect(tipEntry.jobSelectorPrimary.locator('option:checked')).toHaveText('Brunch Spot · Midtown');

    await history.deleteAllShifts();
    await settings.deleteAllJobs();
  });
});

// ---------------------------------------------------------------------------
// P2-009 — History Job Filter
// ---------------------------------------------------------------------------
test.describe('P2-009: History page job filter', () => {
  test('P2-009a: history page should show a job filter dropdown', async ({ page }) => {
    const history = new HistoryPage(page);
    const settings = new SettingsPage(page);

    await settings.goto();
    await settings.createJob(
      JOB_PROFILES.primary.name,
      JOB_PROFILES.primary.location,
      JOB_PROFILES.primary.hourlyRate,
    );

    await history.goto();
    await expect(history.jobFilterDropdown).toBeVisible();

    await settings.deleteAllJobs();
  });

  test('P2-009b: filtering by a specific job should narrow history results', async ({ page }) => {
    const settings = new SettingsPage(page);
    const tipEntry = new TipEntryPage(page);
    const history = new HistoryPage(page);
    const multiJob = page.getByRole('cell', { name: '$' }).nth(3);

    await settings.goto();
    await settings.createJob(
      JOB_PROFILES.primary.name,
      JOB_PROFILES.primary.location,
      JOB_PROFILES.primary.hourlyRate,
    );
    await settings.createJob(
      JOB_PROFILES.secondary.name,
      JOB_PROFILES.secondary.location,
      JOB_PROFILES.secondary.hourlyRate,
    );

    // Log a shift for the secondary job
    await tipEntry.goto();

    await tipEntry.fillShift({
      date: SAMPLE_SHIFT.date,
      startTime: SAMPLE_SHIFT.startTime,
      endTime: SAMPLE_SHIFT.endTime,
      cashTips: SAMPLE_SHIFT.cashTips,
      creditTips: SAMPLE_SHIFT.creditTips,
    });

    await tipEntry.jobSelectorPrimary.click();
    await tipEntry.jobSelectorPrimary.selectOption({ label: 'Brunch Spot · Midtown' });
    await tipEntry.submit();
    await expect(tipEntry.successMessage).toBeVisible();

    await tipEntry.fillShift({
      date: SAMPLE_SHIFT.date,
      startTime: SAMPLE_SHIFT.startTime,
      endTime: SAMPLE_SHIFT.endTime,
      cashTips: SAMPLE_SHIFT.cashTips,
      creditTips: SAMPLE_SHIFT.creditTips,
    });

    await tipEntry.jobSelectorPrimary.click();
    await tipEntry.jobSelectorPrimary.selectOption({ label: 'The Rooftop · Downtown' });
    await tipEntry.submit();
    await expect(tipEntry.successMessage).toBeVisible();

    await history.goto();

    await history.listViewButton.scrollIntoViewIfNeeded();
    await history.listViewButton.click();
    await expect(multiJob).toBeVisible();

    await history.jobFilterDropdown.scrollIntoViewIfNeeded();
    await history.jobFilterDropdown.click();
    await history.jobFilterDropdown.selectOption({ label: 'The Rooftop' });

    await history.listViewButton.scrollIntoViewIfNeeded();
    await expect(multiJob).toBeHidden();

    await history.deleteAllShifts();
    await settings.deleteAllJobs();


  });

  test('P2-009c: "All Jobs" filter option should restore all shifts', async ({ page }) => {
    const settings = new SettingsPage(page);
    const tipEntry = new TipEntryPage(page);
    const history = new HistoryPage(page);
    const multiJob = page.getByRole('cell', { name: '$' }).nth(3);

    await settings.goto();
    await settings.createJob(
      JOB_PROFILES.primary.name,
      JOB_PROFILES.primary.location,
      JOB_PROFILES.primary.hourlyRate,
    );
    await settings.createJob(
      JOB_PROFILES.secondary.name,
      JOB_PROFILES.secondary.location,
      JOB_PROFILES.secondary.hourlyRate,
    );

    // Log a shift for the secondary job
    await tipEntry.goto();

    await tipEntry.fillShift({
      date: SAMPLE_SHIFT.date,
      startTime: SAMPLE_SHIFT.startTime,
      endTime: SAMPLE_SHIFT.endTime,
      cashTips: SAMPLE_SHIFT.cashTips,
      creditTips: SAMPLE_SHIFT.creditTips,
    });

    await tipEntry.jobSelectorPrimary.click();
    await tipEntry.jobSelectorPrimary.selectOption({ label: 'Brunch Spot · Midtown' });
    await tipEntry.submit();
    await expect(tipEntry.successMessage).toBeVisible();

    await tipEntry.fillShift({
      date: SAMPLE_SHIFT.date,
      startTime: SAMPLE_SHIFT.startTime,
      endTime: SAMPLE_SHIFT.endTime,
      cashTips: SAMPLE_SHIFT.cashTips,
      creditTips: SAMPLE_SHIFT.creditTips,
    });

    await tipEntry.jobSelectorPrimary.click();
    await tipEntry.jobSelectorPrimary.selectOption({ label: 'The Rooftop · Downtown' });
    await tipEntry.submit();
    await expect(tipEntry.successMessage).toBeVisible();

    await history.goto();

    await history.listViewButton.scrollIntoViewIfNeeded();
    await history.listViewButton.click();
    await expect(multiJob).toBeVisible();

    await history.jobFilterDropdown.scrollIntoViewIfNeeded();
    await history.jobFilterDropdown.click();
    await history.jobFilterDropdown.selectOption({ label: 'The Rooftop' });

    await history.listViewButton.scrollIntoViewIfNeeded();
    await expect(multiJob).toBeHidden();

    await history.jobFilterDropdown.click();
    await history.jobFilterDropdown.selectOption({ label: 'All Jobs' });

    await history.listViewButton.scrollIntoViewIfNeeded();
    await expect(multiJob).toBeVisible();

    await history.deleteAllShifts();
    await settings.deleteAllJobs();
  });
});

// ---------------------------------------------------------------------------
// P2-010 — Per-Job Dashboard Analytics
// ---------------------------------------------------------------------------
test.describe('P2-010: Per-job dashboard analytics', () => {
  test('P2-010a: dashboard should show a per-job analytics filter dropdown', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const settings = new SettingsPage(page);

    await settings.goto();
    await settings.createJob(
      JOB_PROFILES.primary.name,
      JOB_PROFILES.primary.location,
      JOB_PROFILES.primary.hourlyRate,
    );
    await settings.createJob(
      JOB_PROFILES.secondary.name,
      JOB_PROFILES.secondary.location,
      JOB_PROFILES.secondary.hourlyRate,
    );

    await dashboard.goto();
    await expect(dashboard.jobFilterDropdown).toBeVisible();

    await settings.deleteAllJobs();
  });

  test('P2-010b: selecting a job filter should update summary cards', async ({ page }) => {
    const settings = new SettingsPage(page);
    const tipEntry = new TipEntryPage(page);
    const history = new HistoryPage(page);
    const dashboard = new DashboardPage(page);
    const firstJob = page.getByText('$131.00')
    const secondJob = page.getByText('$232.00')

    await settings.goto();
    await settings.createJob(
      JOB_PROFILES.primary.name,
      JOB_PROFILES.primary.location,
      JOB_PROFILES.primary.hourlyRate,
    );
    await settings.createJob(
      JOB_PROFILES.secondary.name,
      JOB_PROFILES.secondary.location,
      JOB_PROFILES.secondary.hourlyRate,
    );

    // Log a shift for the secondary job
    await tipEntry.goto();

    await tipEntry.fillShift({
      date: SAMPLE_SHIFT.date,
      startTime: SAMPLE_SHIFT.startTime,
      endTime: SAMPLE_SHIFT.endTime,
      cashTips: 131,
      creditTips: SAMPLE_SHIFT.creditTips,
    });

    await tipEntry.jobSelectorPrimary.click();
    await tipEntry.jobSelectorPrimary.selectOption({ label: 'Brunch Spot · Midtown' });
    await tipEntry.submit();
    await expect(tipEntry.successMessage).toBeVisible();

    await tipEntry.fillShift({
      date: SAMPLE_SHIFT.date,
      startTime: SAMPLE_SHIFT.startTime,
      endTime: SAMPLE_SHIFT.endTime,
      cashTips: 232,
      creditTips: SAMPLE_SHIFT.creditTips,
    });

    await tipEntry.jobSelectorPrimary.click();
    await tipEntry.jobSelectorPrimary.selectOption({ label: 'The Rooftop · Downtown' });
    await tipEntry.submit();
    await expect(tipEntry.successMessage).toBeVisible();

    await dashboard.goto();
    await dashboard.jobFilterDropdown.click();
    await dashboard.jobFilterDropdown.selectOption({ label: 'Brunch Spot' });
    await expect(firstJob).toBeVisible();
    
    await dashboard.jobFilterDropdown.click();
    await dashboard.jobFilterDropdown.selectOption({ label: 'The Rooftop' });
    await expect(secondJob).toBeVisible();


    await history.deleteAllShifts();
    await settings.deleteAllJobs();
  });
});

// ---------------------------------------------------------------------------
// P2-011 — Job-Scoped Tip-Out Configuration
// ---------------------------------------------------------------------------
test.describe('P2-011: Job-scoped tip-out configuration', () => {
  test('P2-011a: each job should have its own tip-out configuration', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.createJob(
      JOB_PROFILES.primary.name,
      JOB_PROFILES.primary.location,
      JOB_PROFILES.primary.hourlyRate,
    );

    // Navigate into the job's detail/edit view and check for a tip-out config section
    await settings.editJobButton.click();
    const tipOutSection = page.locator('[data-testid="job-tip-out-config"]');
    await expect(tipOutSection).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// P2-012 — Database Migration Safety
// ---------------------------------------------------------------------------
test.describe('P2-012: Multi-job schema migration', () => {
  test('P2-012a: pre-Phase-2 shifts should remain visible after job migration', async ({ page }) => {
    // LEGACY_SHIFT represents data that existed before jobs were introduced.
    // The test verifies no data was lost during the job_id nullable migration.
    const history = new HistoryPage(page);
    await history.goto();

    // The history should contain at least the shifts logged before multi-job was added
    const count = await history.getVisibleRowCount();
    expect(count).toBeGreaterThan(0);

    // Verify the legacy shift date appears somewhere in the history
    await history.searchByKeyword(LEGACY_SHIFT.date);
    const legacyCount = await history.getVisibleRowCount();
    expect(legacyCount).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// P2-020 — Full E2E: Create Job → Log Tips → Filter History → Per-Job Analytics
// ---------------------------------------------------------------------------
test.describe('P2-020: Multi-job end-to-end workflow', () => {
  test('P2-020a: create job → log shift → filter history → check per-job analytics', async ({ page }) => {
    // Step 1: Create a job profile (skip if it already exists)
    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.jobTab.click();
    await settings.addJobButton.waitFor({ state: 'visible' });

    if (!(await settings.primaryJob.isVisible())) {
      await settings.createJob(
        JOB_PROFILES.primary.name,
        JOB_PROFILES.primary.location,
        JOB_PROFILES.primary.hourlyRate,
      );
    }

    await expect(settings.primaryJob).toContainText(JOB_PROFILES.primary.name);

    // Step 2: Log a shift for that job
    const tipEntry = new TipEntryPage(page);
    const job = new JobProfilePage(page);
    await job.gotoTipEntry();
    await job.jobSelectorDropdown.selectOption(JOB_PROFILES.primary.name);
    await tipEntry.fillShift({
      date: SAMPLE_SHIFT.date,
      startTime: SAMPLE_SHIFT.startTime,
      endTime: SAMPLE_SHIFT.endTime,
      cashTips: SAMPLE_SHIFT.cashTips,
      creditTips: SAMPLE_SHIFT.creditTips,
      tipPool: SAMPLE_SHIFT.tipPool,
    });
    await tipEntry.submit();
    await expect(tipEntry.successMessage).toBeVisible();

    // Step 3: Filter history by the job and verify the shift appears
    const history = new HistoryPage(page);
    await history.goto();
    await job.selectJobFilter(JOB_PROFILES.primary.name);
    const rowCount = await history.getVisibleRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // Step 4: Per-job analytics on dashboard
    const dashboard = new DashboardPage(page);
    await job.gotoDashboard();
    await job.selectJobFilter(JOB_PROFILES.primary.name);
    await expect(dashboard.summaryCardTotalTips).toBeVisible();
    await expect(dashboard.cashCreditChart).toBeVisible();
  });
});
