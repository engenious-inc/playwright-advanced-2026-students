/* eslint-disable playwright/no-wait-for-timeout -- intentional capstone anti-patterns */
import { test, expect } from '@playwright/test';
import { skipUnlessJuiceShopUp } from '../../../shared/test-guards.js';
import { JuiceShopEndpoints } from '../../../shared/anchor-helpers/juice-shop/endpoints.js';

test.describe('M16 messy suite @m16-capstone', () => {
  test.beforeEach(async ({ request }) => {
    await skipUnlessJuiceShopUp(request);
  });

  test('basket button exists after hard wait', async ({ page }) => {
    // SMELL: a third copy of the login flow, with the credentials typed inline again —
    // duplicating both the other spec in this directory AND shared/.../endpoints.ts.
    await page.goto(JuiceShopEndpoints.baseUrl + '/#/login');
    await page.waitForTimeout(2000); // SMELL: hard wait
    await page
      .getByRole('button', { name: /dismiss cookie message/i })
      .click({ timeout: 4000 })
      .catch(() => undefined);
    // SMELL: banner dismissal copy-pasted here too — a fourth copy of the same six lines.
    await page
      .getByRole('button', { name: 'Close Welcome Banner' })
      .click({ timeout: 4000 })
      .catch(() => undefined);
    await page.getByLabel('Text field for the login email').fill('admin@juice-sh.op');
    await page.getByLabel('Text field for the login password').fill('admin123');
    await page.locator('#loginButton').click(); // SMELL: raw CSS id over a role locator
    await page.waitForTimeout(2000); // SMELL: hard wait standing in for a real signal
    await expect(page.getByRole('button', { name: /shopping cart/i })).toBeVisible();
  });
});
