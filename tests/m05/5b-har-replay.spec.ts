import { test, expect } from '../../shared/fixtures/index.js';
import {
  startCategoryBrowseServer,
  stopServer,
  CATEGORY_BROWSE_CATEGORIES,
} from './fixtures/local-anchor-server.js';

// The committed proof behind 5.B's on-camera claims — the same relationship
// tests/m04/4c-fixtures.spec.ts has to 4.B–4.F: this file is the non-negotiable evidence that
// "capture once, replay forever" is genuinely true, not just narrated.
//
// A local server stands in for the anchor site (same pattern as
// examples/where-this-breaks/m05-har-leaks-pii): `routeFromHAR` needs a real network round-trip
// to capture, and a local server gives that without touching tubitv.com or hand-writing a HAR.

const EXPECTED_TEXT = CATEGORY_BROWSE_CATEGORIES.map((c) => c.name).join(', ');

test('5.B baseline: update:true captures the real network into a HAR file', async ({
  page,
  context,
}, testInfo) => {
  const harPath = testInfo.outputPath('capture.har');
  const { server, origin } = await startCategoryBrowseServer(CATEGORY_BROWSE_CATEGORIES);

  try {
    await context.routeFromHAR(harPath, { update: true });
    await page.goto(origin);
    await expect(page.locator('#categories')).toHaveText(EXPECTED_TEXT);
  } finally {
    await stopServer(server);
  }
});

test('5.B: replay serves from the HAR alone — the server is never touched, and it is deterministic', async ({
  browser,
}, testInfo) => {
  // Capture first, against a live server.
  const harPath = testInfo.outputPath('capture.har');
  const { server, origin } = await startCategoryBrowseServer(CATEGORY_BROWSE_CATEGORIES);
  const captureContext = await browser.newContext();
  await captureContext.routeFromHAR(harPath, { update: true });
  const capturePage = await captureContext.newPage();
  await capturePage.goto(origin);
  await expect(capturePage.locator('#categories')).toHaveText(EXPECTED_TEXT);
  await captureContext.close(); // flushes the HAR to disk

  // The server is torn down BEFORE replay — if replay reached the network at all, every
  // request would fail with a connection error, not a HAR-served 200.
  await stopServer(server);

  const replayContext = await browser.newContext();
  await replayContext.routeFromHAR(harPath, { update: false });
  const replayPage = await replayContext.newPage();

  await replayPage.goto(origin);
  await expect(replayPage.locator('#categories')).toHaveText(EXPECTED_TEXT);

  // Reload twice more — same HAR entries, same response, every time. This IS the "run it
  // again, and again, and again, get the same thing" beat the narration describes.
  for (let i = 0; i < 2; i++) {
    await replayPage.reload();
    await expect(replayPage.locator('#categories')).toHaveText(EXPECTED_TEXT);
  }

  await replayContext.close();
});

test('5.B: default notFound "abort" rejects a replayed request outside the HAR — even though the live server could answer it', async ({
  browser,
}, testInfo) => {
  const harPath = testInfo.outputPath('capture.har');
  const { server, origin } = await startCategoryBrowseServer(CATEGORY_BROWSE_CATEGORIES);

  // Capture only the root page — /other-path is never visited during capture.
  const captureContext = await browser.newContext();
  await captureContext.routeFromHAR(harPath, { update: true });
  const capturePage = await captureContext.newPage();
  await capturePage.goto(origin);
  await captureContext.close();

  // The server stays up and CAN answer /other-path — proving the failure below comes from
  // routeFromHAR's default notFound: 'abort', not from the server being unreachable.
  const replayContext = await browser.newContext();
  await replayContext.routeFromHAR(harPath); // notFound not specified — defaults to 'abort'
  const replayPage = await replayContext.newPage();

  await expect(replayPage.goto(`${origin}/other-path`)).rejects.toThrow();

  await replayContext.close();
  await stopServer(server);
});
