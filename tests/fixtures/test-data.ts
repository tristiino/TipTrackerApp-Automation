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

// ---------------------------------------------------------------------------
// Phase 2 — Tip-Out Calculator (P2-001 to P2-006, P2-019)
// ---------------------------------------------------------------------------

/** Tip-out role definitions used to create templates in settings. */
export const TIP_OUT_ROLES = {
  busser: {
    name: 'Busser',
    type: 'percent' as const,
    amount: 3,
  },
  bartender: {
    name: 'Bartender',
    type: 'percent' as const,
    amount: 5,
  },
  host: {
    name: 'Host',
    type: 'fixed' as const,
    amount: 10,
  },
};

/**
 * A shift with a known gross so net calculations can be asserted precisely.
 * gross = $200 cash + $150 credit = $350
 * With busser (3%) + bartender (5%) = $28 tip-out → net = $322
 */
export const TIP_OUT_SHIFT = {
  ...SAMPLE_SHIFT,
  cashTips: 200,
  creditTips: 150,
  expectedGross: 350,
  expectedTipOut: 28,   // 3% + 5% of $350
  expectedNet: 322,
};

/**
 * Edge-case: roles that total exactly 100% of gross.
 * Used for P2-019a.
 */
export const FULL_SPLIT_ROLES = [
  { name: 'Role A', type: 'percent' as const, amount: 60 },
  { name: 'Role B', type: 'percent' as const, amount: 40 },
];

/**
 * Edge-case: mixed percent + fixed roles.
 * gross = $100; 10% = $10 + $5 fixed = $15 total tip-out → net = $85.
 * Used for P2-019b.
 */
export const MIXED_SPLIT_ROLES = [
  { name: 'Mixed Pct',   type: 'percent' as const, amount: 10 },
  { name: 'Mixed Fixed', type: 'fixed'   as const, amount: 5  },
];

// ---------------------------------------------------------------------------
// Phase 2 — Multi-Job Support (P2-007 to P2-012, P2-020)
// ---------------------------------------------------------------------------

export const JOB_PROFILES = {
  primary: {
    name: 'The Rooftop',
    location: 'Downtown',
    hourlyRate: 8,
  },
  secondary: {
    name: 'Brunch Spot',
    location: 'Midtown',
    hourlyRate: 7.25,
  },
};

// ---------------------------------------------------------------------------
// Phase 2 — Shift Notes, Tags & Search (P2-013 to P2-018, P2-022, P2-025)
// ---------------------------------------------------------------------------

export const TAGGED_SHIFT = {
  ...SAMPLE_SHIFT,
  note: 'Busy patio shift, large party of 12.',
  tags: ['busy night', 'patio', 'event'],
};

/** Tags used to verify autocomplete suggestions on the second shift. */
export const SECOND_TAGGED_SHIFT = {
  ...SAMPLE_SHIFT,
  date: addDaysISO(new Date(), -2),
  cashTips: 60,
  creditTips: 90,
  note: 'Quiet inside section.',
  tags: ['patio', 'slow night'],
};
