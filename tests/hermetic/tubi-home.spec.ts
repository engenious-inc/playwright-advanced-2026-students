import { test, expect } from '../../shared/fixtures/index.js';
import { TubiHomePage } from '../../shared/anchor-helpers/tubi/TubiHomePage.js';

/**
 * Hermetic fallback for the debut demos (IMPROVEMENT-PLAN P2.3).
 *
 * The flagship M07 demos ("watch each method generate a test on Tubi") verify the
 * TubiHomePage adapter against the LIVE site — which is geo-gated, WAF-throttled, and
 * re-skinned without notice, so it is testIgnore'd in CI. This spec exercises the SAME
 * adapter getters against a controlled `setContent` page shaped like Tubi's home, giving
 * CI a deterministic proof that the adapter's locator strategies still resolve — the
 * mitigation for "the demo can't run because Tubi changed / the runner isn't in the US."
 * Same pattern as `m13/accessibility.spec.ts` (setContent + the real API, no live site).
 *
 * We instantiate TubiHomePage directly (not via the `tubiHome` fixture) on purpose: the
 * fixture path navigates to the live site; here we drive the adapter over a fixture DOM.
 * If Tubi's real structure drifts from this fixture, the scheduled recon job
 * (`.github/workflows/recon-tubi.yml`, P4.5) is what catches it against the live site.
 */

const TILES = Array.from(
  { length: 12 },
  (_, i) => `<div class="web-content-tile"><a href="/movies/${i + 1}">Title ${i + 1}</a></div>`,
).join('');

const TUBI_HOME_FIXTURE = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Tubi</title></head>
  <body>
    <header>
      <a href="/" aria-label="Tubi logo">Tubi</a>
      <nav aria-label="Primary">
        <a href="/movies">Movies</a>
        <a href="/tv-shows">TV Shows</a>
        <a href="/live">Live TV</a>
        <a href="/search" aria-label="Search">Search</a>
      </nav>
      <a href="/signin">Sign In</a>
      <a href="/register">Register</a>
    </header>
    <main>
      <section aria-label="Recommended">
        <h2>Recommended</h2>
        ${TILES}
      </section>
    </main>
  </body>
</html>`;

test.describe('Tubi home adapter — hermetic fallback (P2.3)', () => {
  test('adapter selectors resolve on a Tubi-shaped page without the live site', async ({
    page,
  }) => {
    await page.setContent(TUBI_HOME_FIXTURE);
    const home = new TubiHomePage(page);

    await expect(home.tubiLogo).toBeVisible();
    await expect(home.signInLink).toBeVisible();
    await expect(home.registerLink).toBeVisible();
    await expect(home.categoryNav).toBeVisible();
    await expect(home.searchLink).toBeVisible();
    await expect(home.categoryCarousels.first()).toBeVisible();
  });

  test('the browse assertion the debut demo makes holds on the fixture (≥12 tiles)', async ({
    page,
  }) => {
    await page.setContent(TUBI_HOME_FIXTURE);
    const home = new TubiHomePage(page);

    const tileCount = await home.contentTiles.count();
    expect(tileCount).toBeGreaterThanOrEqual(12);
  });
});
