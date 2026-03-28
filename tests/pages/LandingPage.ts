import { Page, Locator, expect } from '@playwright/test';

/**
 * LandingPage — Page Object Model
 * Encapsulates all interactions with the public-facing marketing landing page.
 * Covers Sprint 1 stories: P1-001 through P1-006.
 */
export class LandingPage {
  readonly page: Page;

  readonly heroSection: Locator;
  readonly heroHeadline: Locator;
  readonly heroSubtext: Locator;
  readonly heroCTAButton: Locator;
  readonly featureCards: Locator;
  readonly screenshotCarousel: Locator;
  /** App mockups on the marketing page (bundled under assets/screenshots/) */
  readonly screenshotImages: Locator;
  readonly navRegisterCTA: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroSection = page.locator('[data-testid="hero"], section.hero, #hero').first();
    this.heroHeadline = page.getByRole('heading', { level: 1 });
    this.heroSubtext = page.locator('[data-testid="hero-subtext"], .hero-subtext, .hero p').first();
    this.heroCTAButton = page.getByRole('link', { name: /get started|sign up|try free/i }).first();
    this.featureCards = page.locator('[data-testid="feature-card"], .feature-card, .features .card');
    this.screenshotCarousel = page.getByRole('img', {
      name: /Tip entry form showing cash and credit tip fields/i,
    });
    this.screenshotImages = page.locator('img[src*="assets/screenshots/"]');
    this.navRegisterCTA = page.getByRole('link', { name: /register|sign up/i }).first();
  }

  async goto() {
    await this.page.goto('/');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/^\/?(\?.*)?$/);
    await expect(this.heroHeadline).toBeVisible();
  }

  async clickHeroCTA() {
    await this.heroCTAButton.click();
  }

  async clickNavRegister() {
    await this.navRegisterCTA.click();
  }

  async findScreenShots() {
    const target = this.screenshotCarousel;
    await target.waitFor({ state: 'attached', timeout: 15_000 });
    const step = () => Math.round((this.page.viewportSize()?.height ?? 800) * 0.85);
    for (let i = 0; i < 12; i++) {
      if (await target.isVisible()) break;
      await this.page.mouse.wheel(0, step());
    }
    await target.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
    await expect(target).toBeVisible();
  }
}
