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

export const SAMPLE_SHIFT = {
  date: '2024-06-15',
  startTime: '16:00',
  endTime: '23:00',
  hoursWorked: 7,
  cashTips: 85.5,
  creditTips: 120.0,
  totalSales: 950.0,
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
