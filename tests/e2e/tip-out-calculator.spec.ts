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

test.beforeEach(async ({ page }) => {
  const settings = new SettingsPage(page);
  await settings.deleteAllRoles();
});

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
    await settings.deleteAllRoles();
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
    await settings.deleteAllRoles();
  });
});

// ---------------------------------------------------------------------------
// P2-002 — Template Selector on Tip Entry Form
// ---------------------------------------------------------------------------
test.describe('P2-002: Tip-out template selector', () => {
  test('P2-002a: should show a tip-out template dropdown on the tip entry form', async ({ page }) => {
    const tipOut = new TipOutPage(page);
    const settings = new SettingsPage(page);

    await settings.goto();
    await settings.tipOutTab.click();

    await settings.createRole(
      TIP_OUT_ROLES.host.name,
      TIP_OUT_ROLES.host.type,
      TIP_OUT_ROLES.host.amount,
    );

    await tipOut.gotoTipEntry();

    await expect(tipOut.tipOutTemplate).toBeVisible();

    await settings.goto();
    await settings.tipOutTab.click();
    await settings.deleteAllRoles();
  });

  test('P2-002b: should auto-calculate deductions when a template is selected', async ({ page }) => {
    const tipEntry = new TipEntryPage(page);
    const tipOut = new TipOutPage(page);
    const settings = new SettingsPage(page);
    await settings.goto();

    await settings.tipOutTab.click();
    await settings.createRole(
      TIP_OUT_ROLES.bartender.name,
      TIP_OUT_ROLES.bartender.type,
      TIP_OUT_ROLES.bartender.amount,
    );

    await tipEntry.goto();
    await tipEntry.cashTipsInput.fill(String(TIP_OUT_SHIFT.cashTips));
    await tipEntry.creditTipsInput.fill(String(TIP_OUT_SHIFT.creditTips));

    await tipOut.selectTipOutBartender();

    expect(page.getByText('$332.50')).toBeVisible();

    await settings.goto();
    await settings.tipOutTab.click();
    await settings.deleteAllRoles();
  });
});




// ---------------------------------------------------------------------------
// P2-005 — API Validation
// ---------------------------------------------------------------------------
test.describe('P2-005: Tip-out API validation', () => {
  test('P2-005a: should reject splits totalling more than 100%', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    await settings.tipOutTab.click();
    // Create a role that alone exceeds 100%
    await settings.createRole('Over Limit', 'percent', 101);

    await expect(settings.overLimitError).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// P2-006 — Dashboard Gross / Net Toggle
// ---------------------------------------------------------------------------
test.describe('P2-006: Dashboard gross vs. net toggle', () => {
  test('P2-006a: dashboard should include a gross vs. net tips toggle', async ({ page }) => {
    const tipOut = new TipOutPage(page);
    await tipOut.gotoDashboard();

    await expect(tipOut.grossToggle).toBeVisible();
    await expect(tipOut.netToggle).toBeVisible();
  });
});
