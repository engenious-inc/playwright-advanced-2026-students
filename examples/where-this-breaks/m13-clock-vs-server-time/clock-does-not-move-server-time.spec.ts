import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * 13.F failure mode 2 — "`page.clock` doesn't control server time."
 *
 * `page.clock` is a browser-side fake. It rewrites what `Date`, `setTimeout` and friends report
 * INSIDE the page. It has no reach into your backend, so anything the server stamps — an expiry,
 * a "posted 3 minutes ago", a signed token's `exp` — keeps moving on real wall-clock time.
 *
 * That asymmetry is the trap. Advance the clock 30 days to test an expiry banner and the client
 * believes it is 30 days later while the server still says today. The test passes or fails for
 * reasons that have nothing to do with the behaviour you meant to check.
 *
 * Fix: control server time at the source — a seeded fixture, an injectable clock, or an API that
 * accepts an "as of" parameter in test mode. `page.clock` covers the client half only.
 */

let server: Server;
let origin: string;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url?.startsWith('/api/now')) {
      // The server stamps its own time. Nothing the browser does can influence this.
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ serverYear: new Date().getUTCFullYear() }));
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html' }).end(`<!doctype html><body>
      <div id="client">?</div><div id="server">?</div>
      <script>
        document.getElementById('client').textContent = String(new Date().getUTCFullYear());
        fetch('/api/now').then((r) => r.json()).then((j) => {
          document.getElementById('server').textContent = String(j.serverYear);
        });
      </script>
    </body>`);
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()));
});

test('THE TRAP — the clock moves the client 10 years on; the server does not budge', async ({
  page,
}) => {
  const realYear = new Date().getUTCFullYear();

  await page.clock.setFixedTime(new Date(Date.UTC(realYear + 10, 0, 1)));
  await page.goto(origin);

  // The page believes it is a decade from now...
  await expect(page.locator('#client')).toHaveText(String(realYear + 10));
  // ...while the very same page's API call reports the real year.
  await expect(page.locator('#server')).toHaveText(String(realYear));

  // This test PASSES. That is the point: nothing errors, nothing warns. A suite built on
  // page.clock alone will happily assert against two different notions of "now" and look green.
});

test('THE FIX — ask the server for the time you want, do not fake it client-side', async ({
  page,
}) => {
  const realYear = new Date().getUTCFullYear();

  // Stand in for a backend that accepts an "as of" in test mode (a seeded fixture or an
  // injectable clock does the same job). Now BOTH halves agree, which is the actual requirement.
  await page.route('**/api/now*', (route) =>
    route.fulfill({ json: { serverYear: realYear + 10 } }),
  );
  await page.clock.setFixedTime(new Date(Date.UTC(realYear + 10, 0, 1)));
  await page.goto(origin);

  await expect(page.locator('#client')).toHaveText(String(realYear + 10));
  await expect(page.locator('#server')).toHaveText(String(realYear + 10));
});
