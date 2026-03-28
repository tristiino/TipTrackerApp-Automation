import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';

/**
 * Landing Page test suite
 * Sprint 1 — P1-001 through P1-006
 * Covers: hero section, feature highlights, screenshots, CTA navigation, responsiveness.
 */

test.describe('Landing Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Public page — no auth

  test('P1-001: should display hero section with headline, subtext, and CTA above the fold', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.heroHeadline).toBeVisible();
    await expect(landing.heroSubtext).toBeVisible();
    await expect(landing.heroCTAButton).toBeVisible();

    // Verify elements are in the viewport (above the fold)
    const ctaBoundingBox = await landing.heroCTAButton.boundingBox();
    const viewportHeight = page.viewportSize()?.height ?? 768;
    expect(ctaBoundingBox?.y).toBeLessThan(viewportHeight);
  });

  test('P1-002: should display at least 4 feature cards with icons, titles, and descriptions', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    const cards = landing.featureCards;
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('P1-003: should display at least 2 app screenshots or mockup images', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await landing.findScreenShots();

    // SPA serves mockups from assets/screenshots/ (not .carousel / data-testid wrappers)
    const count = await landing.screenshotImages.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('P1-004: primary CTA button should navigate to /register', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await landing.clickHeroCTA();
    await expect(page).toHaveURL(/register/i);
  });

  test('P1-004: nav bar secondary CTA should also link to /register', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await landing.clickNavRegister();
    await expect(page).toHaveURL(/register/i);
  });

  test.describe('P1-006: Responsive layout', () => {
    const breakpoints = [
      { name: 'mobile (375px)', width: 375, height: 812 },
      { name: 'tablet (768px)', width: 768, height: 1024 },
      { name: 'desktop (1280px)', width: 1280, height: 800 },
    ];

    for (const { name, width, height } of breakpoints) {
      test(`should render correctly at ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        const landing = new LandingPage(page);
        await landing.goto();

        await expect(landing.heroHeadline).toBeVisible();
        await expect(landing.heroCTAButton).toBeVisible();

        // No horizontal scrollbar
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(width);
      });
    }
  });
});
