import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * 5.E failure mode 1 — "HARs leak PII."
 *
 * `recordHar` captures the traffic verbatim: request headers, request bodies, response bodies.
 * That is the whole point — a faithful recording is what makes `routeFromHAR` replay work. It
 * also means the Authorization header you sent, the password in the login body, and every
 * personal detail in the response are now sitting in a file you are about to commit.
 *
 * This is not a hypothetical. A HAR is exactly the kind of artifact that gets attached to a bug
 * ticket, dropped in a chat thread, or committed "temporarily" to a branch.
 *
 * Fix: record with `content: 'omit'` when you only need timing and shape, and scrub what remains.
 * If you need bodies for replay, treat the HAR as a secret: scrub it before it leaves your machine
 * and never let one reach a public repo unreviewed.
 */

const SECRET = 'Bearer sk-live-DO-NOT-COMMIT-ME';
const EMAIL = 'real.person@example.com';

let server: Server;
let origin: string;
let dir: string;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url?.startsWith('/api/me')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ email: EMAIL, plan: 'premium' }));
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html' }).end(`<!doctype html><body>
      <div id="out">?</div>
      <script>
        fetch('/api/me', { headers: { authorization: ${JSON.stringify(SECRET)} } })
          .then((r) => r.json())
          .then((j) => { document.getElementById('out').textContent = j.plan; });
      </script>
    </body>`);
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  dir = mkdtempSync(join(tmpdir(), 'har-leak-'));
});

test.afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()));
  rmSync(dir, { recursive: true, force: true });
});

test('THE LEAK — a default HAR contains the auth token and the user PII verbatim', async ({
  browser,
}) => {
  const harPath = join(dir, 'default.har');
  const context = await browser.newContext({ recordHar: { path: harPath } });
  const page = await context.newPage();
  await page.goto(origin);
  await expect(page.locator('#out')).toHaveText('premium');
  await context.close(); // HAR is flushed on close

  const har = readFileSync(harPath, 'utf8');

  // Both of these are in the file, in plaintext. This test PASSES — that is the finding.
  expect(har).toContain('sk-live-DO-NOT-COMMIT-ME');
  expect(har).toContain(EMAIL);
});

test('THE FIX — content: "omit" keeps the shape and drops the bodies', async ({ browser }) => {
  const harPath = join(dir, 'omitted.har');
  const context = await browser.newContext({
    recordHar: { path: harPath, content: 'omit' },
  });
  const page = await context.newPage();
  await page.goto(origin);
  await expect(page.locator('#out')).toHaveText('premium');
  await context.close();

  const har = readFileSync(harPath, 'utf8');

  // The response body — and the PII in it — is gone.
  expect(har).not.toContain(EMAIL);
  // The request is still recorded, so the HAR is still useful for shape and timing.
  expect(har).toContain('/api/me');

  // NOTE the sharp edge: `content: 'omit'` drops response BODIES. It does NOT strip request
  // HEADERS, so the Authorization token is still there. Omitting content is necessary and not
  // sufficient — scrub headers too before a HAR leaves your machine.
  expect(har).toContain('sk-live-DO-NOT-COMMIT-ME');
});
