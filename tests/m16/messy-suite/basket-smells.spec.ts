import { existsSync } from 'node:fs';
import { test, expect } from '../../../shared/fixtures/index.js';
import { skipUnlessJuiceShopUp } from '../../../shared/test-guards.js';

const authPath = '.auth/juice-shop-admin.json';

/**
 * `m16-clean-end` — refactored from the messy-start version of this file.
 *
 * Was: an inline login duplicating credentials, three `waitForTimeout` calls, a raw `#loginButton`
 * click, and a cart assertion. The hard waits were doing the job the assertions should do — and
 * doing it worse: waiting the full 2s when the page is ready in 200ms, and still failing when it
 * needs 2.1s.
 */

test.describe('M16 capstone — refactored @m16-capstone', () => {
  // M15: reuse the session tests/auth.setup.ts already captured. Same guard M15's own spec uses,
  // so running this file without the setup project skips rather than fails confusingly.
  if (existsSync(authPath)) {
    test.use({ storageState: authPath });
  }

  test.beforeEach(async ({ request }) => {
    test.skip(!existsSync(authPath), 'Run the setup project first to capture the admin session');
    await skipUnlessJuiceShopUp(request);
  });

  // The basket control only exists for an authenticated user, so this test depends on the auth
  // that `tests/auth.setup.ts` already performs — no second login, no second copy of the
  // credentials. M15's storage state is what makes that free.
  test('logged-in user sees the basket control', async ({ juiceShopHome, page }) => {
    await juiceShopHome.goto();

    await expect(page.getByRole('button', { name: /shopping cart/i })).toBeVisible();
  });
});
