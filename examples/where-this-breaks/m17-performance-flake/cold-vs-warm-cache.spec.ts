import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * 17.F failure modes 2 and 3 — "cold-cache vs warm-cache divergence" and "performance flake."
 *
 * A performance budget asserts a number. Numbers from a real browser move, and the single biggest
 * mover is not your code — it is whether the asset was already cached.
 *
 * Run the same page twice in the same context and the second run is dramatically faster, because
 * nothing was fetched. Neither number is wrong. They answer different questions: cold is what a
 * first-time visitor gets, warm is what a returning one gets. A budget that does not say which it
 * means will flake based on nothing more than test ORDER — and "fix" itself if you re-run.
 *
 * This example makes the divergence deterministic by having the server count requests, so the
 * lesson does not depend on machine timing (which would make this file the very flake it teaches).
 *
 * Fix: choose the scenario deliberately. `context.clearCookies()` / a fresh context for cold,
 * a warmed context for warm — and budget each separately. Never let cache state be incidental.
 */

let server: Server;
let origin: string;
let assetRequests = 0;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url?.startsWith('/app.js')) {
      assetRequests += 1;
      res.writeHead(200, {
        'content-type': 'text/javascript',
        // A real, long-lived cache header — the thing that creates the divergence.
        'cache-control': 'public, max-age=31536000, immutable',
      });
      res.end('window.__loaded = true;');
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' });
    res.end('<!doctype html><body><script src="/app.js"></script></body>');
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()));
});

test('THE TRAP — the second visit in the same context never fetches the asset', async ({
  browser,
}) => {
  assetRequests = 0;
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(origin, { waitUntil: 'load' });
  const afterFirst = assetRequests;

  await page.goto(origin, { waitUntil: 'load' });
  const afterSecond = assetRequests;

  // Cold: fetched. Warm: served from cache, zero network.
  expect(afterFirst).toBe(1);
  expect(afterSecond).toBe(1);

  // Two runs of the identical test measured two different things. Whichever one your budget
  // happens to observe depends on what ran before it — which is test order, not performance.
  await context.close();
});

test('THE FIX — a fresh context per measurement makes "cold" mean cold', async ({ browser }) => {
  assetRequests = 0;

  for (let i = 0; i < 2; i += 1) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(origin, { waitUntil: 'load' });
    await context.close();
  }

  // Both runs paid the same cost, so a cold budget is now comparing like with like.
  expect(assetRequests).toBe(2);
});
