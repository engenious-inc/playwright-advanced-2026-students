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
  await expect(page.getByRole('button', { name: 'Go to login page' })).toHaveCount(0);

  await context.storageState({ path: '.auth/juice-shop-admin.json' });
});
