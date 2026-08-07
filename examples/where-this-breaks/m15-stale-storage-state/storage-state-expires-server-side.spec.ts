import { test, expect, type Browser } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * 15.I failure mode 3 — "storage state expires server-side without the client knowing."
 *
 * `storageState` is a snapshot of cookies and localStorage. Replaying it makes the BROWSER look
 * logged in: the cookie is present, the app's client-side "am I authenticated?" check passes, the
 * UI renders the signed-in shell. None of that consults your backend.
 *
 * So when the session is revoked server-side — a password change, an admin logout-everywhere, a
 * short server TTL, a deploy that rotated the signing key — the saved state keeps producing a
 * convincing logged-in page whose every API call is a 401.
 *
 * The failure surfaces far from its cause. You get a test failing on "expected 3 items, found 0",
 * or a timeout waiting for content that will never load, and you go looking for a bug in the
 * feature. The auth layer looked fine, because the part of it you can see was fine.
 *
 * Fix: assert authentication against something only a real session can produce, in the first test
 * of every project that depends on setup — and fail fast and loudly when it doesn't.
 */

const LIVE = 'live-token';
const REVOKED = 'revoked-token';

let server: Server;
let origin: string;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const cookie = req.headers.cookie ?? '';
    if (req.url?.startsWith('/api/items')) {
      // The server is the only thing that knows a token was revoked.
      if (!cookie.includes('live-token')) {
        res.writeHead(401, { 'content-type': 'application/json' }).end('{"error":"unauthorized"}');
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' }).end('{"items":["a","b","c"]}');
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html' }).end(`<!doctype html><body>
      <!-- The app's own client-side check: "there is a session cookie, so we're signed in." -->
      <div id="shell">${cookie.includes('session=') ? 'signed-in' : 'signed-out'}</div>
      <div id="items">loading</div>
      <script>
        fetch('/api/items')
          .then((r) => r.ok ? r.json() : { items: [] })
          .then((j) => { document.getElementById('items').textContent = String(j.items.length); });
      </script>
    </body>`);
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()));
});

/** Stand-in for a `storageState` file: a session cookie replayed into a fresh context. */
async function contextWith(browser: Browser, token: string) {
  const context = await browser.newContext();
  await context.addCookies([{ name: 'session', value: token, url: origin }]);
  return context;
}

test('THE TRAP — revoked state still renders a convincing signed-in page', async ({ browser }) => {
  const context = await contextWith(browser, REVOKED);
  const page = await context.newPage();
  await page.goto(origin);

  // The UI is entirely persuaded. A test that asserts on the shell passes here.
  await expect(page.locator('#shell')).toHaveText('signed-in');

  // ...but every API call is a 401, so the feature under test is silently empty. The failure a
  // real suite reports is "expected 3 items, found 0" — which reads like a data bug, not an
  // auth bug, and sends you looking in the wrong place.
  await expect(page.locator('#items')).toHaveText('0');

  await context.close();
});

test('THE FIX — assert something only a live session can produce, and fail fast', async ({
  browser,
}) => {
  // Run this as the first assertion of any project that depends on the setup project. It is the
  // difference between "auth broke" and three days of debugging a feature that works.
  for (const [cookie, expected] of [
    [REVOKED, false],
    [LIVE, true],
  ] as const) {
    const context = await contextWith(browser, cookie);
    const page = await context.newPage();
    const response = await page.request.get(`${origin}/api/items`);
    expect(response.ok()).toBe(expected);
    await context.close();
  }
});
