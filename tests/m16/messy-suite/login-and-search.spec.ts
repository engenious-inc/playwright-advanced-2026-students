import { test, expect } from '../../../shared/fixtures/index.js';
import { skipUnlessJuiceShopUp } from '../../../shared/test-guards.js';
import { JuiceShopLoginPage } from '../../../shared/anchor-helpers/juice-shop/JuiceShopLoginPage.js';

/**
 * `m16-clean-end` — the destination state of the 16.G capstone refactor.
 *
 * Every behaviour the messy suite covered is still covered here. What changed is HOW:
 * interaction moved into adapters, waiting moved to web-first assertions, credentials moved to
 * fixtures, and the file-level `eslint-disable` is gone because there is nothing left to silence.
 *
 * Diff this against `m16-messy-start` to see the whole refactor.
 */

test.describe('M16 capstone — refactored @m16-capstone', () => {
  test.beforeEach(async ({ request }) => {
    await skipUnlessJuiceShopUp(request);
  });

  // M07/M08: the adapter owns navigation, banner dismissal and readiness. The test says what it
  // is checking, not how to reach it. M03: no hard wait — `goto()` settles on a real signal, and
  // `toBeVisible()` auto-waits.
  test('home shows product cards', async ({ juiceShopHome }) => {
    await juiceShopHome.goto();

    await expect(juiceShopHome.productCards.first()).toBeVisible();
  });

  // M03/M09: was `const visible = await …isVisible(); expect(visible).toBeTruthy()` — a snapshot
  // read with no retry, which flakes the moment the app is a frame slower. The web-first matcher
  // retries until the timeout.
  test('search control is present', async ({ juiceShopHome }) => {
    await juiceShopHome.goto();

    await expect(juiceShopHome.searchBox).toBeVisible();
  });

  // M09: this test was the false positive — named "admin can log in", asserting `toHaveURL(/.*/)`,
  // which is true of every page ever loaded. It never logged in and never checked a logged-in
  // state. It now performs the login and asserts the post-condition its name always claimed.
  //
  // M14/M15: credentials come from JuiceShopFixtures via the adapter, not typed inline.
  test('admin can log in', async ({ page }) => {
    const login = new JuiceShopLoginPage(page);
    await login.goto();

    await login.loginAsDefaultAdmin();

    // The real post-condition: the "Go to login page" control is gone once authenticated.
    await expect(page.getByRole('button', { name: 'Go to login page' })).toHaveCount(0);
  });

  // M09: the messy version branched on `if (await cart.isVisible())` and asserted a different
  // thing in each arm — a test that cannot fail, because whichever way the app behaved some
  // assertion passed. Conditional coverage is not coverage. This asserts one outcome: a
  // successful login leaves the app on the product search route.
  //
  // The basket control that the messy version's `if` arm reached for is asserted once, in
  // basket-smells.spec.ts, where the basket concern belongs.
  test('a successful login lands on the product search route', async ({ page }) => {
    const login = new JuiceShopLoginPage(page);
    await login.goto();

    await login.loginAsDefaultAdmin();

    await expect(page).toHaveURL(/#\/search/);
  });
});
