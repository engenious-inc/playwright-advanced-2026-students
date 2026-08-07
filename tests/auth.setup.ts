import { test as setup, expect } from '@playwright/test';
import { skipUnlessJuiceShopUp } from '../shared/test-guards.js';
import { JuiceShopLoginPage } from '../shared/anchor-helpers/juice-shop/JuiceShopLoginPage.js';

/**
 * M15 storage-state capture — runs in the `setup` project before browser tests.
 * Uses Juice Shop (local, no reCAPTCHA). Tubi login is not attempted here.
 */
setup('authenticate juice-shop admin', async ({ page, context, request }) => {
  await skipUnlessJuiceShopUp(request);

  const loginPage = new JuiceShopLoginPage(page);
  await loginPage.goto();
  await loginPage.loginAsDefaultAdmin();

  // Wait for a signal only a COMPLETED login can produce, then capture.
  //
  // This previously asserted `getByRole('button', { name: 'Go to login page' })).toHaveCount(0)`.
  // Measured against the pinned image on 2026-08-06: that button does not render on the home
  // toolbar whether or not you are signed in, so the assertion was true before the login request
  // had even returned. It gated nothing, storageState was captured while localStorage was still
  // empty, and every downstream test silently ran unauthenticated — `origins: []` in the written
  // file, with no cookie or token to show for it.
  //
  // Juice Shop keeps its JWT in localStorage, so that is the thing worth waiting on.
  await page.waitForURL(/#\/search/, { timeout: 15_000 });
  await expect
    .poll(() => page.evaluate(() => Boolean(localStorage.getItem('token'))), { timeout: 15_000 })
    .toBe(true);

  await context.storageState({ path: '.auth/juice-shop-admin.json' });
});
