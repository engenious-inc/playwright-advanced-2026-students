import { test, expect } from '../shared/fixtures/index.js';
import { skipUnlessJuiceShopUp } from '../shared/test-guards.js';
import { JuiceShopEndpoints } from '../shared/anchor-helpers/juice-shop/endpoints.js';

/**
 * Smoke test — verifies the test harness runs end-to-end.
 * Not a course module test; this is here so a fresh clone can `npm test`
 * and confirm everything is wired correctly before recording starts.
 *
 * Intentionally minimal — asserts harness can reach each anchor, NOT specific
 * selectors. Selector-level coverage is the job of the module tests that
 * consume the adapters. Smoke tests should outlive UI redesigns.
 */
test('tubi home loads with branding and category nav', async ({ tubiHome, page }) => {
  // Live Tubi is a production site (anti-automation; markup varies by browser/IP),
  // so it isn't a deterministic CI signal — run this locally/headed. CI gates on
  // the Juice Shop smoke below + the static checks. See playwright.config.ts.
  test.skip(!!process.env.CI, 'live Tubi is not a deterministic CI target');
  await tubiHome.goto();
  await expect(page).toHaveTitle(/Watch Free Movies and TV Shows Online \| Tubi/i);
  await expect(tubiHome.tubiLogo.first()).toBeVisible();
  await expect(tubiHome.signInLink).toBeVisible();
  await expect(tubiHome.categoryNav).toBeVisible();
});

// Note: a "tubi shows content carousels" assertion is intentionally NOT in smoke.
// Carousels don't render reliably in headless Playwright (Tubi's lazy-loading +
// possible automation detection). This is real production-site behavior M07 will
// teach students to handle (scroll triggers, longer waits, headed mode for recording).
// The TubiHomePage.waitForCarouselsLoaded() method exists for module-level tests
// that handle this explicitly.

test('juice-shop home is reachable', async ({ page, request }) => {
  await skipUnlessJuiceShopUp(request);
  const response = await page.goto(JuiceShopEndpoints.baseUrl + '/');
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveURL(/localhost:3000/);
});
