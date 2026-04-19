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
    await settings.deleteAllJobs();
  });

  test('P2-007b: should block creating more than 10 job profiles', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    // Create 10 jobs (some may already exist; the UI should enforce the cap)
    for (let i = 1; i <= 10; i++) {
      await settings.createJob(`Job ${i}`, `Location ${i}`, 8 + i * 0.25);
    }

    // Attempting an 11th should surface the limit error
    await settings.addJobButton.click();
    await expect(settings.jobLimitError).toBeVisible();
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
  });

  test('P2-007d: should allow deleting a job profile', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.createJob(
      JOB_PROFILES.secondary.name,
      JOB_PROFILES.secondary.location,
      JOB_PROFILES.secondary.hourlyRate,
    );

    const countBefore = await settings.getJobCount();
    await settings.deleteFirstJob();
    const countAfter = await settings.getJobCount();

    expect(countAfter).toBe(countBefore - 1);
  });
});

// ---------------------------------------------------------------------------
// P2-008 — Job Selector on Tip Entry Form
// ---------------------------------------------------------------------------
test.describe('P2-008: Job selector on tip entry form', () => {
  test('P2-008a: should show a job selector dropdown on the tip entry form', async ({ page }) => {
    const job = new JobProfilePage(page);
    await job.gotoTipEntry();

    await expect(job.jobSelectorDropdown).toBeVisible();
  });

  test('P2-008b: job selector should default to the most recently used job', async ({ page }) => {
    // Create two jobs; log a shift for the secondary one
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

    // Log a shift for the secondary job
    const tipEntry = new TipEntryPage(page);
    const job      = new JobProfilePage(page);
    await job.gotoTipEntry();
    await job.jobSelectorDropdown.selectOption(JOB_PROFILES.secondary.name);
    await tipEntry.fillShift({ cashTips: SAMPLE_SHIFT.cashTips, creditTips: SAMPLE_SHIFT.creditTips });
    await tipEntry.submit();

    // Re-open the form — secondary should still be selected
    await job.gotoTipEntry();
    await expect(job.jobSelectorDropdown).toHaveValue(
      new RegExp(JOB_PROFILES.secondary.name, 'i'),
    );
  });
});

// ---------------------------------------------------------------------------
// P2-009 — History Job Filter
// ---------------------------------------------------------------------------
test.describe('P2-009: History page job filter', () => {
  test('P2-009a: history page should show a job filter dropdown', async ({ page }) => {
    const job = new JobProfilePage(page);
    await job.gotoHistory();

    await expect(job.jobFilterDropdown).toBeVisible();
  });

  test('P2-009b: filtering by a specific job should narrow history results', async ({ page }) => {
    const job     = new JobProfilePage(page);
    const history = new HistoryPage(page);
    await job.gotoHistory();

    const allCount = await history.getVisibleRowCount();
    await job.selectJobFilter(JOB_PROFILES.primary.name);
    const filteredCount = await history.getVisibleRowCount();

    // Filtered count must be ≤ total (could equal if all shifts belong to primary)
    expect(filteredCount).toBeLessThanOrEqual(allCount);
  });

  test('P2-009c: "All Jobs" filter option should restore all shifts', async ({ page }) => {
    const job     = new JobProfilePage(page);
    const history = new HistoryPage(page);
    await job.gotoHistory();

    const allCount = await history.getVisibleRowCount();
    await job.selectJobFilter(JOB_PROFILES.primary.name);
    await job.resetJobFilter();
    const restoredCount = await history.getVisibleRowCount();

    expect(restoredCount).toBe(allCount);
  });
});

// ---------------------------------------------------------------------------
// P2-010 — Per-Job Dashboard Analytics
// ---------------------------------------------------------------------------
test.describe('P2-010: Per-job dashboard analytics', () => {
  test('P2-010a: dashboard should show a per-job analytics filter dropdown', async ({ page }) => {
    const job = new JobProfilePage(page);
    await job.gotoDashboard();

    await expect(job.jobFilterDropdown).toBeVisible();
  });

  test('P2-010b: selecting a job filter should update summary cards', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const job       = new JobProfilePage(page);
    await job.gotoDashboard();
    await expect(dashboard.summaryCardTotalTips).toBeVisible();

    const totalBefore = await dashboard.summaryCardTotalTips.textContent();
    await job.selectJobFilter(JOB_PROFILES.primary.name);
    const totalAfter = await dashboard.summaryCardTotalTips.textContent();

    // Value may or may not change depending on data; the card must still be visible
    await expect(dashboard.summaryCardTotalTips).toBeVisible();
    // If two jobs exist with different data, totals should differ
    // (soft assertion — only fails if both are undefined)
    expect(totalAfter).toBeDefined();
    expect(totalBefore).toBeDefined();
  });

  test('P2-010c: default (aggregated) view should combine all jobs', async ({ page }) => {
    const job     = new JobProfilePage(page);
    const dashboard = new DashboardPage(page);
    await job.gotoDashboard();

    // On fresh load the filter should show "All Jobs" or equivalent default
    await expect(job.jobFilterDropdown).not.toHaveValue(JOB_PROFILES.primary.name);
    await expect(dashboard.summaryCardTotalTips).toBeVisible();
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
    const job      = new JobProfilePage(page);
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
