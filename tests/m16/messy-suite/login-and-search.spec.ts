/* eslint-disable
     playwright/no-wait-for-timeout,
     playwright/no-conditional-in-test,
     playwright/no-conditional-expect,
     playwright/prefer-web-first-assertions
   -- INTENTIONAL capstone anti-patterns. This is the `m16-messy-start` state
      students refactor in 16.G; the smells here are the exercise. Do NOT "fix"
      this file — the clean destination is the separate refactor. */
import { test, expect, type Page } from '@playwright/test';
import { skipUnlessJuiceShopUp } from '../../../shared/test-guards.js';
import { JuiceShopEndpoints } from '../../../shared/anchor-helpers/juice-shop/endpoints.js';

// SMELL: base URL reached for directly in tests; no page-object, no fixtures.
const BASE = JuiceShopEndpoints.baseUrl;

// SMELL: banner-dismissal copy-pasted into every test instead of an adapter method.
async function dismissBannersInline(page: Page): Promise<void> {
  const cookie = page.getByRole('link', { name: /dismiss/i });
  if (await cookie.isVisible({ timeout: 4000 }).catch(() => false)) {
    await cookie.click();
  }
  const welcome = page.getByRole('button', { name: 'Close Welcome Banner' });
  if (await welcome.isVisible({ timeout: 4000 }).catch(() => false)) {
    await welcome.click();
  }
}

test.describe('M16 messy suite @m16-capstone', () => {
  test.beforeEach(async ({ request }) => {
    await skipUnlessJuiceShopUp(request);
  });

  test('home shows products after a hard wait', async ({ page }) => {
    await page.goto(BASE + '/#/');
    await page.waitForTimeout(3000); // SMELL: hard wait instead of a web-first wait
    await dismissBannersInline(page); // SMELL: duplicated dismissal
    // SMELL: raw CSS + .first(); no scoped, role-based assertion.
    await expect(page.locator('mat-card[class*="product"]').first()).toBeVisible();
  });

  test('search control is present', async ({ page }) => {
    await page.goto(BASE + '/#/');
    await page.waitForTimeout(3000); // SMELL: hard wait
    await dismissBannersInline(page); // SMELL: duplicated dismissal (again)
    // SMELL: weak assertion — reads a boolean then asserts truthiness instead of
    // an auto-waiting web-first matcher.
    const visible = await page.getByRole('button', { name: 'Open search' }).isVisible();
    expect(visible).toBeTruthy();
  });

  // SMELL: FALSE POSITIVE. Named as if it verifies login, but it only asserts the
  // URL is a string — which is always true. It never logs in and never checks a
  // logged-in state. Passes green while testing nothing.
  test('admin can log in', async ({ page }) => {
    await page.goto(BASE + '/#/login');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/.*/);
  });

  test('login with inline credentials', async ({ page }) => {
    await page.goto(BASE + '/#/login');
    await page.waitForTimeout(2000); // SMELL: hard wait
    // SMELL: credentials hard-coded inline, duplicating shared/.../endpoints.ts fixtures.
    await page.getByLabel('Text field for the login email').fill('admin@juice-sh.op');
    await page.getByLabel('Text field for the login password').fill('admin123');
    await page.locator('#loginButton').click(); // SMELL: raw CSS id over getByRole
    await page.waitForTimeout(2000); // SMELL: hard wait for navigation
    // SMELL: conditional branching in a test — a test should assert one behavior.
    const cart = page.getByRole('button', { name: /shopping cart/i });
    if (await cart.isVisible().catch(() => false)) {
      await expect(cart).toBeVisible();
    } else {
      expect(page.url()).toContain('login');
    }
  });
});
