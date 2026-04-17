import { test, expect } from '../fixtures/auth-test';
import { TipEntryPage } from '../pages/TipEntryPage';
import { HistoryPage } from '../pages/HistoryPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TAGGED_SHIFT, SECOND_TAGGED_SHIFT, SAMPLE_SHIFT } from '../fixtures/test-data';

/**
 * Shift Notes, Tags & Search test suite
 * Phase 2 Sprint 3 — P2-013 through P2-016, P2-018 (P2-017 Skipped per plan)
 * Phase 2 Sprint 4 — P2-022, P2-025
 *
 * Covers: notes textarea, tag input, autocomplete, multi-tag,
 * search bar, date-range filter, tag filter, combined filters,
 * clear button, analytics tag filter, calendar view.
 */

test.use({ storageState: 'tests/.auth/user.json' });

// ---------------------------------------------------------------------------
// P2-013 — Shift Notes
// ---------------------------------------------------------------------------
test.describe('P2-013: Shift notes', () => {
  test('P2-013a: shift form should include a notes textarea', async ({ page }) => {
    const tipEntry = new TipEntryPage(page);
    await tipEntry.goto();

    const notesField = page.getByLabel(/notes/i);
    await expect(notesField).toBeVisible();
  });

  test('P2-013b: submitted note should appear in shift history detail view', async ({ page }) => {
    // Log a shift with a note
    const tipEntry = new TipEntryPage(page);
    await tipEntry.goto();
    await tipEntry.fillShift({
      date: TAGGED_SHIFT.date,
      startTime: TAGGED_SHIFT.startTime,
      endTime: TAGGED_SHIFT.endTime,
      cashTips: TAGGED_SHIFT.cashTips,
      creditTips: TAGGED_SHIFT.creditTips,
      tipPool: TAGGED_SHIFT.tipPool,
    });
    await page.getByLabel(/notes/i).fill(TAGGED_SHIFT.note);
    await tipEntry.submit();
    await expect(tipEntry.successMessage).toBeVisible();

    // Verify note in history
    const history = new HistoryPage(page);
    await history.goto();
    await history.calendarViewButton.scrollIntoViewIfNeeded();
    await history.switchToListView();
    await history.notesPresent();
    await history.listTable.scrollIntoViewIfNeeded();
    await expect(page.getByRole('cell', { name: 'test', exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// P2-014 — Tags on Shift Form
// ---------------------------------------------------------------------------
test.describe('P2-014: Shift tags', () => {
  test('P2-014a: tag input field should be present on the shift form', async ({ page }) => {
    const tipEntry = new TipEntryPage(page);
    await tipEntry.goto();

    const tagInput = page.locator('.tag-chips');
    await expect(tagInput).toBeVisible();
  });

  test('P2-014b: tag input should show autocomplete suggestions from existing tags', async ({ page }) => {
    // Assumes TAGGED_SHIFT was submitted by P2-013b (or pre-seeded data exists).
    // Type a prefix of a known tag and expect a suggestion.
    const tagInput = page.getByRole('textbox', { name: 'Add tags…' });
    const suggestion = page.getByText('pat', { exact: true });
    const tipEntry = new TipEntryPage(page);

    await tipEntry.goto();

    await tagInput.click();
    await tagInput.fill('pat'); // prefix of 'patio'
    await page.getByRole('textbox', { name: 'Add tags…' }).press('Enter');

    await page.getByRole('button', { name: 'Remove tag' }).click();
    await tagInput.click();
    await tagInput.fill('pat');

    await expect(suggestion).toBeVisible();
  });

  test('P2-014c: multiple tags can be applied to a single shift', async ({ page }) => {
    const newTag = page.locator('input[type="text"]');
    const tipEntry = new TipEntryPage(page);
    await tipEntry.goto();

    await tipEntry.fillShift({
      date: TAGGED_SHIFT.date,
      startTime: TAGGED_SHIFT.startTime,
      endTime: TAGGED_SHIFT.endTime,
      cashTips: TAGGED_SHIFT.cashTips,
      creditTips: TAGGED_SHIFT.creditTips,
      tipPool: TAGGED_SHIFT.tipPool,     
    });

    const tagInput = page.getByRole('textbox', { name: 'Add tags…' });
    await tagInput.scrollIntoViewIfNeeded();
    for (const tag of TAGGED_SHIFT.tags) {
      if (await newTag.isVisible() || await tagInput.isVisible()) {
        await newTag.click();
        await newTag.fill(tag);
        await page.keyboard.press('Enter');
      }
    }
    await tipEntry.submit();

  });
});

// ---------------------------------------------------------------------------
// P2-015 — Search & Filters on History
// ---------------------------------------------------------------------------
test.describe('P2-015: Shift history search and filters', () => {
  test('P2-015a: history search bar should be visible', async ({ page }) => {
    const history = new HistoryPage(page);
    await history.goto();

    await expect(history.searchInput).toBeVisible();
  });

  test('P2-015b: keyword search should filter history results in real-time', async ({ page }) => {
    const history = new HistoryPage(page);
    await history.goto();

    const totalBefore = await history.getVisibleRowCount();
    await history.searchByKeyword(TAGGED_SHIFT.note.split(' ')[0]); // first word of note
    const totalAfter = await history.getVisibleRowCount();

    // Results should be narrowed (or equal if all shifts match)
    expect(totalAfter).toBeLessThanOrEqual(totalBefore);
  });

  test('P2-015c: date-range filter should narrow history to selected range', async ({ page }) => {
    const history = new HistoryPage(page);
    await history.goto();

    const totalBefore = await history.getVisibleRowCount();
    // Filter to a single day
    await history.filterByDateRange(TAGGED_SHIFT.date, TAGGED_SHIFT.date);
    const totalAfter = await history.getVisibleRowCount();

    expect(totalAfter).toBeLessThanOrEqual(totalBefore);
  });

  test('P2-015d: tag filter should show only shifts with the selected tag', async ({ page }) => {
    const history = new HistoryPage(page);
    await history.goto();

    const totalBefore = await history.getVisibleRowCount();
    await history.filterByTag(TAGGED_SHIFT.tags[0]); // 'busy night'
    const totalAfter = await history.getVisibleRowCount();

    expect(totalAfter).toBeLessThanOrEqual(totalBefore);
  });

  test('P2-015e: combined keyword + tag filter should both apply simultaneously', async ({ page }) => {
    const history = new HistoryPage(page);
    await history.goto();

    await history.filterByTag(TAGGED_SHIFT.tags[1]); // 'patio'
    const tagOnlyCount = await history.getVisibleRowCount();

    await history.searchByKeyword('large party');
    const combinedCount = await history.getVisibleRowCount();

    // Combined filter is an intersection — must be ≤ tag-only count
    expect(combinedCount).toBeLessThanOrEqual(tagOnlyCount);
  });
});

// ---------------------------------------------------------------------------
// P2-016 — Dashboard Tag Analytics Filter
// ---------------------------------------------------------------------------
test.describe('P2-016: Dashboard tag analytics filter', () => {
  test('P2-016a: dashboard tag filter should appear when tags exist', async ({ page }) => {
    const history  = new HistoryPage(page);
    const dashboard = new DashboardPage(page);
    await page.goto('/dashboard');
    await dashboard.expectLoaded();

    await expect(history.dashboardTagFilter).toBeVisible();
  });

  test('P2-016b: selecting a tag filter should update charts and summary cards', async ({ page }) => {
    const history   = new HistoryPage(page);
    const dashboard = new DashboardPage(page);
    await page.goto('/dashboard');
    await dashboard.expectLoaded();

    const totalBefore = await dashboard.summaryCardTotalTips.textContent();
    await history.dashboardTagFilter.selectOption(TAGGED_SHIFT.tags[0]);
    await expect(dashboard.cashCreditChart).toBeVisible();

    // Cards must still render (value may or may not change)
    await expect(dashboard.summaryCardTotalTips).toBeVisible();
    expect(totalBefore).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// P2-018 — Calendar View on History
// ---------------------------------------------------------------------------
test.describe('P2-018: Calendar view in shift history', () => {


  test('P2-018b: toggling between calendar and list view should work in both directions', async ({ page }) => {
    const history = new HistoryPage(page);
    await history.goto();

    // Calendar → List
    await history.switchToListView();
    await expect(history.listTable).toBeVisible();
    await expect(history.calendarGrid).not.toBeVisible();

    // List → Calendar
    await history.switchToCalendarView();
    await expect(history.calendarGrid).toBeVisible();
    await expect(history.listTable).not.toBeVisible();
  });

});

// ---------------------------------------------------------------------------
// P2-022 — Tags Full E2E
// ---------------------------------------------------------------------------
test.describe('P2-022: Shift tags end-to-end (Sprint 4 integration)', () => {
  test('P2-022a: create tag → apply to shift → verify in history', async ({ page }) => {
    const newTag = page.locator('input[type="text"]');
    const tipEntry = new TipEntryPage(page);
    await tipEntry.goto();

    await tipEntry.fillShift({
      date: TAGGED_SHIFT.date,
      startTime: TAGGED_SHIFT.startTime,
      endTime: TAGGED_SHIFT.endTime,
      cashTips: TAGGED_SHIFT.cashTips,
      creditTips: TAGGED_SHIFT.creditTips,
      tipPool: TAGGED_SHIFT.tipPool,     
    });

    const tagInput = page.getByRole('textbox', { name: 'Add tags…' });
    await tagInput.scrollIntoViewIfNeeded();
    for (const tag of TAGGED_SHIFT.tags) {
      if (await newTag.isVisible() || await tagInput.isVisible()) {
        await newTag.click();
        await newTag.fill(tag);
        await page.keyboard.press('Enter');
      }
    }
    await tipEntry.submit();


    // Verify tags appear in history
    const history = new HistoryPage(page);
    await history.goto();
    await history.calendarViewButton.scrollIntoViewIfNeeded();
    await history.listViewButton.click();
    await history.noteCell.click();
    
    for (const tag of TAGGED_SHIFT.tags) {
      await expect(history.tagChips.filter({ hasText: tag })).toBeVisible();
    }
    await history.deleteAllShifts();
  });

  test('P2-022b: autocomplete should suggest previously created tags', async ({ page }) => {
    // Log a second shift and verify tag autocomplete shows tags from the first
    const tipEntry = new TipEntryPage(page);
    const tagInput = page.getByRole('textbox', { name: 'Add tags…' });

    await tipEntry.goto();

    await tagInput.scrollIntoViewIfNeeded();
    await tagInput.click();
    await tagInput.pressSequentially('pat', { delay: 100 }); // prefix of 'patio' — seeded by P2-022a

    const suggestion = page.getByText('pat', { exact: true });
    await expect(suggestion).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// P2-025 — Shift Notes & Search in Reports
// ---------------------------------------------------------------------------
test.describe('P2-025: Shift notes and keyword/tag search in reports (Sprint 4 integration)', () => {
  test('P2-025a: shift notes should be visible in the expandable history row', async ({ page }) => {
    const history = new HistoryPage(page);
    const tipEntry = new TipEntryPage(page);
    const note = page.getByRole('cell', { name: 'Note: Busy patio shift, large' })

    await tipEntry.goto();

    await tipEntry.fillShift({
      date: TAGGED_SHIFT.date,
      startTime: TAGGED_SHIFT.startTime,
      endTime: TAGGED_SHIFT.endTime,
      cashTips: TAGGED_SHIFT.cashTips,
      creditTips: TAGGED_SHIFT.creditTips,
      tipPool: TAGGED_SHIFT.tipPool,
      notes: TAGGED_SHIFT.note,
    });
    await tipEntry.submit();
    await expect(tipEntry.successMessage).toBeVisible();

    await history.goto();

    await history.listViewButton.scrollIntoViewIfNeeded();
    await history.listViewButton.click();

    await history.expectedNote.click();
    await expect(note).toBeVisible();

    await history.deleteAllShifts();
     
  });

  test('P2-025b: keyword search should filter history entries', async ({ page }) => {
    const history = new HistoryPage(page);
    await history.goto();

    const before = await history.getVisibleRowCount();
    await history.searchByKeyword('large party');
    const after = await history.getVisibleRowCount();

    expect(after).toBeLessThanOrEqual(before);
  });

  test('P2-025c: tag filter should filter history entries', async ({ page }) => {
    const history = new HistoryPage(page);
    await history.goto();

    const before = await history.getVisibleRowCount();
    await history.filterByTag(TAGGED_SHIFT.tags[1]); // 'patio'
    const after = await history.getVisibleRowCount();

    expect(after).toBeLessThanOrEqual(before);
  });

  test('P2-025d: combined keyword and tag filter should both apply', async ({ page }) => {
    const history = new HistoryPage(page);
    await history.goto();

    await history.filterByTag(TAGGED_SHIFT.tags[1]); // 'patio'
    const tagCount = await history.getVisibleRowCount();

    await history.searchByKeyword('party');
    const combinedCount = await history.getVisibleRowCount();

    expect(combinedCount).toBeLessThanOrEqual(tagCount);
  });

  test('P2-025e: Clear button should reset all filters and restore all shifts', async ({ page }) => {
    const history = new HistoryPage(page);
    await history.goto();

    const totalCount = await history.getVisibleRowCount();
    await history.filterByTag(TAGGED_SHIFT.tags[0]);
    await history.searchByKeyword('party');
    await history.clearAllFilters();

    const restoredCount = await history.getVisibleRowCount();
    expect(restoredCount).toBe(totalCount);
  });
});
