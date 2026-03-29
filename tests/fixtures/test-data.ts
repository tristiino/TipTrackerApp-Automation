/**
 * Centralized test data for TipTrackerApp automation suite.
 * Keep credentials here and load secrets from env vars in CI.
 */

export const TEST_USER = {
  username: process.env.TEST_USERNAME || 'testuser_claude',
  email: process.env.TEST_EMAIL || 'testuser@tiptrackerapp.org',
  password: process.env.TEST_PASSWORD || 'TestPass123!',
};

export const INVALID_USER = {
  username: 'notauser_xyz',
  password: 'WrongPassword99!',
};

/** Local calendar date as YYYY-MM-DD (matches `<input type="date">`). */
function addDaysISO(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const SAMPLE_SHIFT = {
  date: addDaysISO(new Date(), -1),
  startTime: '16:00',
  endTime: '23:00',
  hoursWorked: 7,
  cashTips: 85.5,
  creditTips: 120.0,
  totalSales: 950.0,
  tipPool: 1,
};

/**
 * Simulates a pre-Sprint-2 entry that has no cash/credit split.
 * Used to verify P1-012 backward compatibility: legacy entries should
 * display correctly with the new format without data loss.
 */
export const LEGACY_SHIFT = {
  date: '2024-01-10',
  totalTips: 95.0, // stored in cashTips field by migration; creditTips = 0
};
