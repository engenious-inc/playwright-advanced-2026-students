import { test, expect } from '@playwright/test';

/**
 * Intentionally bad test for M09 lecture 9.D — lint demo only.
 * Do not copy patterns from this file. Not executed in `npm test`.
 */
test.skip(true, 'Lint demo fixture — run: npx eslint tests/m09/demo-bad.spec.ts');

test('Tubi home page test', async ({ page }) => {
  await page.goto('https://tubitv.com');
  await page.waitForTimeout(3000);
  if (await page.locator('.nav').isVisible()) {
    await expect(page.locator('.nav')).toBeVisible();
  }
});
