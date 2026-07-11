import { existsSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { skipUnlessJuiceShopUp } from '../../shared/test-guards.js';
import { JuiceShopEndpoints } from '../../shared/anchor-helpers/juice-shop/endpoints.js';

const authPath = '.auth/juice-shop-admin.json';

/**
 * M15 — storage state reuse after auth.setup.ts capture.
 */
test.describe('M15 storage state', () => {
  if (existsSync(authPath)) {
    test.use({ storageState: authPath });
  }

  test('reuses captured juice-shop session', async ({ page, request }) => {
    test.skip(
      !existsSync(authPath),
      'Run setup project first to capture .auth/juice-shop-admin.json',
    );
    await skipUnlessJuiceShopUp(request);
    await page.goto(JuiceShopEndpoints.baseUrl + '/#/account');
    await expect(page.getByRole('button', { name: 'Go to login page' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Show/hide account menu' })).toBeVisible({
      timeout: 15_000,
    });
  });
});
