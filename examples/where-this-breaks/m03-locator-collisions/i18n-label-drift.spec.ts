import { test, expect } from '@playwright/test';

/**
 * 3.E failure mode 3 — "ARIA labels change with i18n."
 *
 * `getByLabel('Email')` is a string match against rendered copy. Switch locale and the copy
 * changes, so the locator stops matching — even though the page is structurally identical and
 * nothing about the control changed. The test failure tells you nothing true about the product.
 *
 * This is the same class of brittleness as a CSS chain, just wearing an accessible-looking
 * costume: role is stable, but the NAME is content, and content is translated.
 *
 * Production shape: a suite that passes in CI (locale forced to en-US) and fails for a colleague
 * whose browser negotiates a different language.
 */

const en = `<label>Email <input type="email" /></label>`;
const es = `<label>Correo electrónico <input type="email" /></label>`;

test('THE FAILURE — an English label locator misses the translated page', async ({ page }) => {
  await page.setContent(es);

  // Anti-pattern: the literal English string is baked into the test.
  await expect(page.getByLabel('Email')).toBeVisible({ timeout: 2000 });
});

test('THE FIX A — match with a regex that spans the locales you support', async ({ page }) => {
  // Note this is a bare regex passed to getByLabel — NOT `{ name: ... }`, which is a getByRole
  // option and silently does nothing here. 3.E calls this out specifically.
  for (const html of [en, es]) {
    await page.setContent(html);
    await expect(page.getByLabel(/^(email|correo)/i)).toBeVisible();
  }
});

test('THE FIX B — pin the locale so rendered copy is deterministic', async ({ browser }) => {
  // The better fix when you control the run: stop testing translation by accident. Fix the
  // locale, and let a separate, deliberate i18n suite cover the other languages.
  const context = await browser.newContext({ locale: 'en-US' });
  const page = await context.newPage();
  await page.setContent(en);

  await expect(page.getByLabel('Email')).toBeVisible();

  await context.close();
});
