import { test, expect } from '../fixtures/auth-test';
import { SettingsPage } from '../pages/SettingsPage';
import { JobProfilePage } from '../pages/JobProfilePage';
import { TipEntryPage } from '../pages/TipEntryPage';
import { DashboardPage } from '../pages/DashboardPage';
import { HistoryPage } from '../pages/HistoryPage';
import { JOB_PROFILES, SAMPLE_SHIFT, LEGACY_SHIFT, TIP_OUT_ROLES } from '../fixtures/test-data';

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
    await settings.deleteAllJobs();
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
    await settings.deleteAllJobs();
    await settings.goto();


    // Create 10 jobs (some may already exist; the UI should enforce the cap)
    for (let i = 1; i <= 10; i++) {
      await settings.createJob(`Job ${i}`, `Location ${i}`, 8 + i * 0.25);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(`Job ${i}`)).toBeVisible();
    }

    await settings.jobLimitError.scrollIntoViewIfNeeded();
    await expect(settings.jobLimitError).toBeVisible();
    await settings.deleteAllJobs();
  });

  test('P2-007c: should allow editing an existing job profile', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.deleteAllJobs();
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

    await settings.deleteAllJobs();

    await settings.goto();
    await settings.jobTab.click();

    while ((await settings.noJobCard.isVisible())) {
      await settings.createJob(
        JOB_PROFILES.primary.name,
        JOB_PROFILES.primary.location,
        JOB_PROFILES.primary.hourlyRate,
      );
    }

    await page.waitForLoadState('networkidle');
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

    await history.deleteAllShifts();
    await settings.deleteAllJobs();

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

    await tipEntry.jobSelectorPrimary.scrollIntoViewIfNeeded();
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

    await history.deleteAllShifts();
    await settings.deleteAllJobs();

    await settings.createJob(
      JOB_PROFILES.primary.name,
      JOB_PROFILES.primary.location,
      JOB_PROFILES.primary.hourlyRate,
    );

    await history.goto();
    await page.waitForLoadState('networkidle');
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

    await tipEntry.jobSelectorPrimary.scrollIntoViewIfNeeded();
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

    await history.deleteAllShifts();
    await settings.deleteAllJobs();

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

    await tipEntry.jobSelectorPrimary.scrollIntoViewIfNeeded();
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

    await settings.deleteAllJobs();

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

    await settings.deleteAllJobs();
    await history.deleteAllShifts();

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

    await tipEntry.jobSelectorPrimary.scrollIntoViewIfNeeded();
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
    await page.waitForLoadState('networkidle');
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
    await page.waitForLoadState('networkidle');

    await settings.tipOutTab.click();
    await settings.createRoleTip(
          TIP_OUT_ROLES.busser.name,
          TIP_OUT_ROLES.busser.type,
          TIP_OUT_ROLES.busser.amount,
        );
    
    const tipOutSection = page.getByText('· The Rooftop');
    await expect(tipOutSection).toBeVisible();

    await settings.deleteAllRoles();
    await settings.deleteAllJobs();
  });
});
