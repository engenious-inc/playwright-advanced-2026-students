import { readFileSync, statSync } from 'node:fs';
import { test, expect } from '../../shared/fixtures/index.js';
import {
  startCategoryBrowseServer,
  stopServer,
  CATEGORY_BROWSE_CATEGORIES,
} from './fixtures/local-anchor-server.js';

// The committed proof behind 5.C's claim: `tracing.startHar` runs alongside `tracing.start` and
// produces a real trace.zip AND a real captured.har from the SAME run — not two narrated artifacts
// that were never actually generated together.

test('5.C: tracing.start + tracing.startHar together produce a real trace.zip and a real captured.har', async ({
  context,
  page,
}, testInfo) => {
  const harPath = testInfo.outputPath('captured.har');
  const tracePath = testInfo.outputPath('trace.zip');
  const { server, origin } = await startCategoryBrowseServer(CATEGORY_BROWSE_CATEGORIES);

  try {
    await context.tracing.start({ snapshots: true, screenshots: true });
    await context.tracing.startHar(harPath);

    await page.goto(origin);
    await expect(page.locator('#categories')).toHaveText(
      CATEGORY_BROWSE_CATEGORIES.map((c) => c.name).join(', '),
    );

    await context.tracing.stop({ path: tracePath });
    await context.tracing.stopHar();
  } finally {
    await stopServer(server);
  }

  // Both artifacts exist and are non-trivial — neither call was a silent no-op.
  expect(statSync(harPath).size).toBeGreaterThan(0);
  expect(statSync(tracePath).size).toBeGreaterThan(0);

  // The HAR genuinely recorded the /api/categories round-trip, not just the page navigation —
  // this is what makes it useful for diagnosing a real failure, per 5.C's claim.
  const har = readFileSync(harPath, 'utf-8');
  expect(har).toContain('/api/categories');
  expect(har).toContain('Recommended For You');
});
