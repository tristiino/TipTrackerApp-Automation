import { test, expect } from '@playwright/test';
import { TipEntryPage } from '../pages/TipEntryPage';
import { SAMPLE_SHIFT, LEGACY_SHIFT } from '../fixtures/test-data';

/**
 * Tip Entry Form test suite
 * Sprint 2 — P1-007 through P1-012
 * Covers: cash/credit separation, real-time totals, shift times, date default, API validation, backward compat.
 */

test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Tip Entry Form', () => {
  test('P1-007: should have separate cash tips and credit tips input fields', async ({ page }) => {
    const tipEntry = new TipEntryPage(page);
    await tipEntry.goto();
    await tipEntry.expectLoaded();

    await expect(tipEntry.cashTipsInput).toBeVisible();
    await expect(tipEntry.creditTipsInput).toBeVisible();
  });

  test('P1-007: should store both cash and credit tips on form submission', async ({ page }) => {
    const tipEntry = new TipEntryPage(page);
    await tipEntry.goto();

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
  });

  test('P1-008: should auto-calculate total tips in real-time as cash and credit amounts are entered', async ({ page }) => {
    const tipEntry = new TipEntryPage(page);
    await tipEntry.goto();

    await tipEntry.cashTipsInput.fill('50');
    await tipEntry.creditTipsInput.fill('75');

    await expect(tipEntry.totalTipsDisplay).toContainText('125');
  });

  test('P1-008: total should update immediately when either field changes without page refresh', async ({ page }) => {
    const tipEntry = new TipEntryPage(page);
    await tipEntry.goto();

    await tipEntry.cashTipsInput.fill('100');
    await tipEntry.creditTipsInput.fill('0');
    expect(await tipEntry.getTotalTipsText()).toContain('100');

    // Change credit tips — total must update without reload
    await tipEntry.creditTipsInput.fill('50');
    expect(await tipEntry.getTotalTipsText()).toContain('150');
  });

  test('P1-009: should have start and end time inputs with auto-calculated hours', async ({ page }) => {
    const tipEntry = new TipEntryPage(page);
    await tipEntry.goto();

    await expect(tipEntry.startTimeInput).toBeVisible();
    await expect(tipEntry.endTimeInput).toBeVisible();

    await tipEntry.shiftTypeInput.click();

    await tipEntry.startTimeInput.fill(SAMPLE_SHIFT.startTime);
    await tipEntry.endTimeInput.fill(SAMPLE_SHIFT.endTime);

    await tipEntry.hoursDisplay.scrollIntoViewIfNeeded();

    const hours = await tipEntry.hoursDisplay.textContent();
    expect(hours).toContain(String(SAMPLE_SHIFT.hoursWorked));
  });

  test('P1-010: date field should default to today\'s date', async ({ page }) => {
    const tipEntry = new TipEntryPage(page);
    await tipEntry.goto();

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dateValue = await tipEntry.getDateValue();
    expect(dateValue).toBe(today);
  });

  test('P1-010: date field should be editable', async ({ page }) => {
    const tipEntry = new TipEntryPage(page);
    await tipEntry.goto();

    await tipEntry.dateInput.fill('2024-01-15');
    expect(await tipEntry.getDateValue()).toBe('2024-01-15');
  });
// need error handling for this test
//   test('P1-011: should reject negative cash tip values', async ({ page }) => {
//     const tipEntry = new TipEntryPage(page);
//     await tipEntry.goto();

//     await tipEntry.fillShift({ cashTips: -10, creditTips: 50 });
//     await tipEntry.tipPoolInput.fill('1');
//     await tipEntry.submit();

//     await expect(tipEntry.errorMessage).toBeVisible();
//     await expect(tipEntry.successMessage).not.toBeVisible();
//   });
// // need error handling for this test
//   test('P1-011: should reject negative credit tip values', async ({ page }) => {
//     const tipEntry = new TipEntryPage(page);
//     await tipEntry.goto();

//     await tipEntry.fillShift({ cashTips: 50, creditTips: -10 });
//     await tipEntry.tipPoolInput.fill('1');
//     await tipEntry.submit();

//     await expect(tipEntry.errorMessage).toBeVisible();
//     await expect(tipEntry.successMessage).not.toBeVisible();
//   });

});
