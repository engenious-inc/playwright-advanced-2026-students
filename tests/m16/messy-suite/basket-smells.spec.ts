/* eslint-disable playwright/no-wait-for-timeout -- intentional capstone anti-patterns */
import { test, expect } from '@playwright/test';
import { skipUnlessJuiceShopUp } from '../../../shared/test-guards.js';
import { JuiceShopEndpoints } from '../../../shared/anchor-helpers/juice-shop/endpoints.js';

test.describe('M16 messy suite preview @m16-capstone', () => {
  test.beforeEach(async ({ request }) => {
    await skipUnlessJuiceShopUp(request);
  });

  test('basket button exists after hard wait', async ({ page }) => {
    await page.goto(JuiceShopEndpoints.baseUrl + '/#/');
    await page.waitForTimeout(2000);
    await expect(page.getByRole('button', { name: /shopping cart/i })).toBeVisible();
  });
});
