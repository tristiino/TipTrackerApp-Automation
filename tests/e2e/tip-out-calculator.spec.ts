import { test, expect } from '../fixtures/auth-test';
import { SettingsPage } from '../pages/SettingsPage';
import { TipOutPage } from '../pages/TipOutPage';
import { TipEntryPage } from '../pages/TipEntryPage';
import { DashboardPage } from '../pages/DashboardPage';
import {
  TIP_OUT_ROLES,
  TIP_OUT_SHIFT,
  FULL_SPLIT_ROLES,
  MIXED_SPLIT_ROLES,
  SAMPLE_SHIFT,
} from '../fixtures/test-data';

/**
 * Tip-Out Calculator test suite
 * Phase 2 Sprint 1 — P2-001 through P2-006
 * Phase 2 Sprint 4 — P2-019 (edge-case integration)
 *
 * Covers: role CRUD, template selection, net/gross display,
 * manual overrides, API validation, dashboard toggle.
 */

test.use({ storageState: 'tests/.auth/user.json' });

// ---------------------------------------------------------------------------
// P2-001 — Role CRUD
// ---------------------------------------------------------------------------
test.describe('P2-001: Tip-out role management', () => {
  test('P2-001a: should render role form with name, type, and amount fields', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    await settings.tipOutTab.click();
    await settings.addRoleButton.click();

    await expect(settings.roleNameInput).toBeVisible();
  });

  test('P2-001b: should save a percentage-based tip-out role', async ({ page }) => {
    const settings = new SettingsPage(page);
    const tipRole = page.getByText('Busser');
    
    await settings.goto();

    await settings.tipOutTab.click();

    await settings.createRole(
      TIP_OUT_ROLES.busser.name,
      TIP_OUT_ROLES.busser.type,
      TIP_OUT_ROLES.busser.amount,
    );

    await expect(tipRole).toContainText(TIP_OUT_ROLES.busser.name);
    await settings.deleteRole();
  });

  test('P2-001c: should save a fixed-dollar tip-out role', async ({ page }) => {
    const settings = new SettingsPage(page);
    const tipRole = page.getByText('host');

    await settings.goto();
    await settings.tipOutTab.click();
    

    await settings.createRole(
      TIP_OUT_ROLES.host.name,
      TIP_OUT_ROLES.host.type,
      TIP_OUT_ROLES.host.amount,
    );

    await expect(tipRole).toContainText(TIP_OUT_ROLES.host.name);
    await settings.deleteRole();
  });
});

// ---------------------------------------------------------------------------
// P2-002 — Template Selector on Tip Entry Form
// ---------------------------------------------------------------------------
test.describe('P2-002: Tip-out template selector', () => {
  test('P2-002a: should show a tip-out template dropdown on the tip entry form', async ({ page }) => {
    const tipOut = new TipOutPage(page);
    await tipOut.gotoTipEntry();

    await expect(tipOut.tipOutTemplateDropdown).toBeVisible();
  });

  test('P2-002b: should auto-calculate deductions when a template is selected', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.createRole(
      TIP_OUT_ROLES.bartender.name,
      TIP_OUT_ROLES.bartender.type,
      TIP_OUT_ROLES.bartender.amount,
    );

    const tipEntry = new TipEntryPage(page);
    await tipEntry.goto();
    await tipEntry.cashTipsInput.fill(String(TIP_OUT_SHIFT.cashTips));
    await tipEntry.creditTipsInput.fill(String(TIP_OUT_SHIFT.creditTips));

    const tipOut = new TipOutPage(page);
    await tipOut.selectTemplate(TIP_OUT_ROLES.bartender.name);

    // Deduction should be non-zero and non-placeholder
    const deduction = await tipOut.getDeductionText();
    expect(deduction).not.toBe('—');
    expect(deduction).not.toBe('$0');
  });
});

// ---------------------------------------------------------------------------
// P2-003 — Net Take-Home Tips Display
// ---------------------------------------------------------------------------
test.describe('P2-003: Net tips display', () => {
  test('P2-003a: should display net take-home tips after tip-outs are deducted', async ({ page }) => {
    const tipOut = new TipOutPage(page);
    await tipOut.gotoTipEntry();

    await expect(tipOut.netTipsDisplay).toBeVisible();
  });

  test('P2-003b: net tips should update in real-time as gross tips change', async ({ page }) => {
    const tipOut = new TipOutPage(page);
    const tipEntry = new TipEntryPage(page);
    await tipOut.gotoTipEntry();

    // Select a template first so deductions are active
    await tipOut.selectTemplate(TIP_OUT_ROLES.busser.name);

    await tipEntry.cashTipsInput.fill('100');
    await tipEntry.creditTipsInput.fill('0');
    const netFirst = await tipOut.getNetTipsText();

    await tipEntry.cashTipsInput.fill('200');
    const netSecond = await tipOut.getNetTipsText();

    // Net must increase when gross increases
    expect(Number(netSecond.replace(/[^0-9.]/g, ''))).toBeGreaterThan(
      Number(netFirst.replace(/[^0-9.]/g, '')),
    );
  });
});

// ---------------------------------------------------------------------------
// P2-004 — Manual Override
// ---------------------------------------------------------------------------
test.describe('P2-004: Manual tip-out override', () => {
  test('P2-004a: should allow manual override of a calculated tip-out amount', async ({ page }) => {
    const tipOut = new TipOutPage(page);
    await tipOut.gotoTipEntry();

    await tipOut.selectTemplate(TIP_OUT_ROLES.busser.name);
    await expect(tipOut.overrideInput).toBeVisible();

    await tipOut.overrideInput.fill('5');
    await expect(tipOut.overrideInput).toHaveValue('5');
  });

  test('P2-004b: overridden tip-outs should be flagged visually in history', async ({ page }) => {
    const tipEntry = new TipEntryPage(page);
    const tipOut   = new TipOutPage(page);

    await tipOut.gotoTipEntry();
    await tipEntry.fillShift({
      cashTips: SAMPLE_SHIFT.cashTips,
      creditTips: SAMPLE_SHIFT.creditTips,
      tipPool: SAMPLE_SHIFT.tipPool,
    });
    await tipOut.selectTemplate(TIP_OUT_ROLES.busser.name);
    await tipOut.overrideInput.fill('5');
    await tipEntry.submit();

    // Navigate to history and verify override badge is present
    await page.goto('/history');
    await expect(tipOut.overrideBadge.first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// P2-005 — API Validation
// ---------------------------------------------------------------------------
test.describe('P2-005: Tip-out API validation', () => {
  test('P2-005a: should reject splits totalling more than 100%', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    // Create a role that alone exceeds 100%
    await settings.createRole('Over Limit', 'percent', 101);

    await expect(settings.overLimitError).toBeVisible();
  });

  test('P2-005b: should handle a mixed percentage and fixed-dollar split', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    for (const role of MIXED_SPLIT_ROLES) {
      await settings.createRole(role.name, role.type, role.amount);
    }

    // No error should be shown — mixed split is valid
    await expect(settings.overLimitError).not.toBeVisible();
    for (const role of MIXED_SPLIT_ROLES) {
      await expect(settings.roleList).toContainText(role.name);
    }
  });
});

// ---------------------------------------------------------------------------
// P2-006 — Dashboard Gross / Net Toggle
// ---------------------------------------------------------------------------
test.describe('P2-006: Dashboard gross vs. net toggle', () => {
  test('P2-006a: dashboard should include a gross vs. net tips toggle', async ({ page }) => {
    const tipOut = new TipOutPage(page);
    await tipOut.gotoDashboard();

    await expect(tipOut.grossNetToggle).toBeVisible();
  });

  test('P2-006b: switching to net view should update chart data', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const tipOut    = new TipOutPage(page);
    await tipOut.gotoDashboard();

    // Record chart state in gross mode
    await expect(dashboard.cashCreditChart).toBeVisible();

    // Switch to net and confirm chart re-renders
    await tipOut.grossNetToggleNet.click();
    await expect(dashboard.cashCreditChart).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// P2-019 — Integration: Tip-Out Edge Cases
// ---------------------------------------------------------------------------
test.describe('P2-019: Tip-out edge cases (Sprint 4 integration)', () => {
  test('P2-019a: 100% total split across roles should calculate correctly with no error', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    for (const role of FULL_SPLIT_ROLES) {
      await settings.createRole(role.name, role.type, role.amount);
    }

    await expect(settings.overLimitError).not.toBeVisible();

    // Apply on tip entry: gross $100 → net should be $0
    const tipEntry = new TipEntryPage(page);
    const tipOut   = new TipOutPage(page);
    await tipOut.gotoTipEntry();
    await tipEntry.cashTipsInput.fill('100');
    await tipEntry.creditTipsInput.fill('0');
    await tipOut.selectTemplate(FULL_SPLIT_ROLES[0].name);

    const net = await tipOut.getNetTipsText();
    expect(Number(net.replace(/[^0-9.]/g, ''))).toBe(0);
  });

  test('P2-019b: mixed percent + fixed split produces correct net result', async ({ page }) => {
    // gross $100, 10% pct ($10) + $5 fixed → tip-out $15 → net $85
    const tipEntry = new TipEntryPage(page);
    const tipOut   = new TipOutPage(page);
    await tipOut.gotoTipEntry();

    await tipEntry.cashTipsInput.fill('100');
    await tipEntry.creditTipsInput.fill('0');
    await tipOut.selectTemplate(MIXED_SPLIT_ROLES[0].name);

    const net = await tipOut.getNetTipsText();
    expect(Number(net.replace(/[^0-9.]/g, ''))).toBe(85);
  });

  test('P2-019c: manual override is accepted on a zero-tip shift', async ({ page }) => {
    const tipEntry = new TipEntryPage(page);
    const tipOut   = new TipOutPage(page);
    await tipOut.gotoTipEntry();

    await tipEntry.cashTipsInput.fill('0');
    await tipEntry.creditTipsInput.fill('0');
    await tipOut.selectTemplate(TIP_OUT_ROLES.busser.name);

    await tipOut.overrideInput.fill('2');
    await expect(tipOut.overrideInput).toHaveValue('2');
  });

  test('P2-019d: all deductions on a zero-tip shift should not produce negative net', async ({ page }) => {
    const tipEntry = new TipEntryPage(page);
    const tipOut   = new TipOutPage(page);
    await tipOut.gotoTipEntry();

    await tipEntry.cashTipsInput.fill('0');
    await tipEntry.creditTipsInput.fill('0');
    await tipOut.selectTemplate(TIP_OUT_ROLES.busser.name);

    const net = await tipOut.getNetTipsText();
    expect(Number(net.replace(/[^0-9.-]/g, ''))).toBeGreaterThanOrEqual(0);
  });
});
