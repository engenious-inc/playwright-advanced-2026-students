import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * 4.F failure mode 1 — "page.route doesn't fire on service-worker requests."
 *
 * Tubi ships a `webpack-offline` worker with a cache-first strategy. When it answers from its own
 * cache there is no network request at all, so there is nothing for a route handler to intercept.
 * Your mock is never consulted and the test sees the cached response — while `page.route` reports
 * no error, because from its point of view nothing happened.
 *
 * 4.F's spec notes this is NOT provable inside `tests/**`: a service worker needs a trustworthy
 * origin and a real local server, which is exactly what this directory exists for. `http://
 * localhost` counts as a secure context, so a plain node server is enough.
 *
 * Fix: `serviceWorkers: 'block'` — a BROWSER-CONTEXT option. There is no `launch()` equivalent,
 * and a fresh context does not help: every test already gets one and the worker registers inside
 * it just the same.
 */

const SW = `
  self.addEventListener('install', (e) => self.skipWaiting());
  self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
  self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/value')) {
      // Cache-first: answer locally, never touch the network.
      event.respondWith(new Response('FROM-SERVICE-WORKER', {
        headers: { 'content-type': 'text/plain' },
      }));
    }
  });
`;

// Two details here are load-bearing, and both were found by running this rather than reasoning
// about it:
//   1. A freshly-registered worker does NOT control the page that registered it. Without the
//      reload, the measured fetch goes straight to the network and page.route "wins" — which
//      would have made this example assert the opposite of what 4.F teaches.
//   2. Registration is wrapped in try/catch and the fetch happens regardless. Under
//      `serviceWorkers: 'block'` the register() call rejects; gating the fetch on it left the
//      page stuck on "idle" and the fix looked broken when it wasn't.
const PAGE = `<!doctype html><body><div id="out">idle</div><script>
  async function boot() {
    const settle = (async () => {
      await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      return true;
    })().catch(() => false);

    // Bounded, because under serviceWorkers:'block' registration neither resolves NOR rejects —
    // it simply hangs, so a plain try/catch never fires and the page sits on "idle" forever.
    const active = await Promise.race([
      settle,
      new Promise((r) => setTimeout(() => r(false), 1500)),
    ]);

    if (active && !navigator.serviceWorker.controller) { location.reload(); return; }

    const r = await fetch('/api/value');
    document.getElementById('out').textContent = await r.text();
  }
  boot();
</script></body>`;

let server: Server;
let origin: string;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/sw.js') {
      res.writeHead(200, { 'content-type': 'text/javascript' }).end(SW);
    } else if (req.url?.startsWith('/api/value')) {
      res.writeHead(200, { 'content-type': 'text/plain' }).end('FROM-REAL-SERVER');
    } else {
      res.writeHead(200, { 'content-type': 'text/html' }).end(PAGE);
    }
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://localhost:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()));
});

test('THE FAILURE — page.route is bypassed entirely by the service worker', async ({ page }) => {
  let handlerRan = false;
  await page.route('**/api/value*', (route) => {
    handlerRan = true;
    return route.fulfill({ body: 'FROM-MOCK', contentType: 'text/plain' });
  });

  await page.goto(origin);
  await expect(page.locator('#out')).toHaveText('FROM-SERVICE-WORKER');

  // The mock was never consulted, and nothing warned you. This assertion documents the trap:
  // a green suite can be reading cached bytes while you believe it is reading your fixture.
  expect(handlerRan).toBe(false);
});

test('THE FIX — serviceWorkers: "block" puts the request back on the wire', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();

  let handlerRan = false;
  await page.route('**/api/value*', (route) => {
    handlerRan = true;
    return route.fulfill({ body: 'FROM-MOCK', contentType: 'text/plain' });
  });

  await page.goto(origin);
  await expect(page.locator('#out')).toHaveText('FROM-MOCK');
  expect(handlerRan).toBe(true);

  await context.close();
});
