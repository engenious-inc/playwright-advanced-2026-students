// Named import: under the repo's NodeNext resolution the CJS default-interop
// makes `import AxeBuilder from …` resolve to the module namespace (not
// constructable), so we import the named export.
import { AxeBuilder } from '@axe-core/playwright';
import { test, expect } from '../../shared/fixtures/index.js';

/**
 * M13 — accessibility audits with `@axe-core/playwright` (lesson 13.D).
 *
 * The lesson shows the AxeBuilder API against live Tubi; that surface is
 * geo-gated and non-deterministic, so the runnable spec audits controlled
 * `setContent` pages instead — same API, no live site, no Docker, CI-safe.
 *
 * The point 13.D makes: violations carry an `impact` (minor / moderate /
 * serious / critical); block on critical at minimum. These specs assert the
 * clean baseline and prove a real critical violation is caught.
 */

const CLEAN_PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Checkout</title>
  </head>
  <body>
    <main>
      <h1>Checkout</h1>
      <img src="logo.png" alt="Store logo" />
      <form>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" />
        <button type="submit">Sign in</button>
      </form>
    </main>
  </body>
</html>`;

// Same page, but the logo loses its alt text — axe rule `image-alt`, impact critical.
const PAGE_WITH_VIOLATION = CLEAN_PAGE.replace('alt="Store logo" ', '');

test.describe('M13 accessibility audits (@axe-core/playwright)', () => {
  test('a clean page has no serious or critical violations', async ({ page }) => {
    await page.setContent(CLEAN_PAGE);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    // Sanity: the scan actually ran (rules were evaluated), not a silent no-op.
    expect(results.passes.length).toBeGreaterThan(0);

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(blocking).toEqual([]);
  });

  test('a missing image alt is caught as a critical violation', async ({ page }) => {
    await page.setContent(PAGE_WITH_VIOLATION);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const criticalIds = results.violations.filter((v) => v.impact === 'critical').map((v) => v.id);
    expect(criticalIds).toContain('image-alt');
  });
});
