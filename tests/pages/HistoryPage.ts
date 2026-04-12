import { Page, Locator, expect } from '@playwright/test';

/**
 * HistoryPage — Page Object Model
 * Encapsulates interactions with the shift history view including:
 *   - Calendar ↔ list view toggle
 *   - Keyword / date-range / tag search and filters
 *   - Expandable shift rows showing notes
 *   - Tag filter (also used by analytics dashboard)
 * Covers Phase 2 Sprint 3 stories: P2-013 to P2-018, P2-022, P2-025, P2-027.
 */
export class HistoryPage {
  readonly page: Page;

  // --- View Toggle ---
  readonly calendarViewButton: Locator;
  readonly listViewButton: Locator;
  readonly calendarGrid: Locator;
  readonly listTable: Locator;

  // --- Search & Filters ---
  readonly searchInput: Locator;
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;
  readonly tagFilterDropdown: Locator;
  readonly clearFiltersButton: Locator;

  // --- History Rows ---
  readonly shiftRows: Locator;
  readonly expandRowButton: Locator;
  readonly shiftNoteText: Locator;
  readonly overrideBadge: Locator;

  // --- Tag Display in History ---
  readonly tagChips: Locator;

  // --- Dashboard Tag Filter (shared locator; navigate to dashboard first) ---
  readonly dashboardTagFilter: Locator;
  readonly allTagsOption: Locator;

  constructor(page: Page) {
    this.page = page;

    // View toggles
    this.calendarViewButton = page.getByRole('button', { name: /calendar/i });
    this.listViewButton     = page.getByRole('button', { name: /list/i });
    this.calendarGrid       = page.locator('[data-testid="calendar-grid"]');
    this.listTable          = page.locator('[data-testid="history-table"]');

    // Filters
    this.searchInput      = page.getByPlaceholder(/search shifts/i);
    this.dateFromInput    = page.getByLabel(/from date/i);
    this.dateToInput      = page.getByLabel(/to date/i);
    this.tagFilterDropdown = page.locator('[data-testid="tag-filter"]');
    this.clearFiltersButton = page.getByRole('button', { name: /clear/i });

    // Rows
    this.shiftRows      = page.locator('[data-testid="shift-row"]');
    this.expandRowButton = page.locator('[data-testid="expand-shift"]').first();
    this.shiftNoteText  = page.locator('[data-testid="shift-note"]');
    this.overrideBadge  = page.locator('[data-testid="override-badge"]');
    this.tagChips       = page.locator('[data-testid="tag-chip"]');

    // Dashboard tag filter
    this.dashboardTagFilter = page.locator('[data-testid="dashboard-tag-filter"]');
    this.allTagsOption      = page.getByRole('option', { name: /all tags/i });
  }

  /** Navigate to the shift history page. */
  async goto() {
    await this.page.goto('/history');
    await expect(this.page).toHaveURL(/history/);
  }

  /** Switch to calendar view and wait for the grid to appear. */
  async switchToCalendarView() {
    await this.calendarViewButton.click();
    await expect(this.calendarGrid).toBeVisible();
  }

  /** Switch to list/table view and wait for the table to appear. */
  async switchToListView() {
    await this.listViewButton.click();
    await expect(this.listTable).toBeVisible();
  }

  /**
   * Runs a keyword search and waits for results to stabilise.
   * @param keyword Text to enter into the search bar
   */
  async searchByKeyword(keyword: string) {
    await this.searchInput.fill(keyword);
    // Small wait for real-time filter debounce
    await this.page.waitForTimeout(400);
  }

  /**
   * Sets a date-range filter.
   * @param from  YYYY-MM-DD start date
   * @param to    YYYY-MM-DD end date
   */
  async filterByDateRange(from: string, to: string) {
    await this.dateFromInput.fill(from);
    await this.dateToInput.fill(to);
    await this.page.waitForTimeout(400);
  }

  /**
   * Selects a tag from the filter dropdown.
   * @param tag Tag label to select (exact match)
   */
  async filterByTag(tag: string) {
    await this.tagFilterDropdown.selectOption(tag);
    await this.page.waitForTimeout(400);
  }

  /** Clears all active search/filter inputs and waits for reset. */
  async clearAllFilters() {
    await this.clearFiltersButton.click();
    await this.page.waitForTimeout(400);
  }

  /**
   * Expands the first shift row and returns the note text content.
   * Asserts the note element is visible before reading.
   */
  async expandFirstRowAndGetNote(): Promise<string> {
    await this.expandRowButton.click();
    await expect(this.shiftNoteText).toBeVisible();
    return (await this.shiftNoteText.textContent()) ?? '';
  }

  /** Returns the count of currently visible shift rows. */
  async getVisibleRowCount(): Promise<number> {
    return this.shiftRows.count();
  }

  /**
   * Checks that a calendar day cell has a non-default colour class,
   * indicating it has been coloured by earnings level.
   */
  async expectCalendarDayColoured() {
    const colouredDay = this.calendarGrid.locator('[class*="earnings-"]').first();
    await expect(colouredDay).toBeVisible();
  }
}
