import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * 12.F failure mode 1 — "DRM-protected content blocks frame capture."
 *
 * M12's frame-capture technique draws the video to a `<canvas>` and reads the pixels back with
 * `toDataURL()` / `getImageData()`. That read is what the browser refuses on protected content:
 * the canvas becomes **tainted**, and the read throws a `SecurityError`.
 *
 * You cannot ship real DRM into a teaching example — a Widevine licence server is not something a
 * student can run. But the browser rule that stops you is not DRM-specific: it is the same
 * origin-taint rule that fires for any cross-origin media drawn without CORS. Same API, same
 * exception, same fix decision. So this example reproduces the exact failure with a cross-origin
 * image, and is explicit that it is standing in for the DRM case.
 *
 * What generalises: the draw always succeeds and the READ is what fails. Any capture helper that
 * only checks "did drawImage throw?" will report success on content it never actually captured.
 *
 * Fix: scope pixel-level assertions to open, non-DRM content, and assert on the player's API
 * (currentTime, buffered, readyState — 12.B material) for protected streams.
 */

let mediaServer: Server;
let mediaOrigin: string;
let pageServer: Server;
let pageOrigin: string;

// 1x1 PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test.beforeAll(async () => {
  // Deliberately serves NO Access-Control-Allow-Origin header — this is what taints the canvas.
  mediaServer = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'image/png' }).end(PNG);
  });
  await new Promise<void>((r) => mediaServer.listen(0, '127.0.0.1', r));
  mediaOrigin = `http://127.0.0.1:${(mediaServer.address() as AddressInfo).port}`;

  // A DIFFERENT origin (localhost vs 127.0.0.1 are cross-origin to each other).
  pageServer = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' }).end('<!doctype html><body></body>');
  });
  await new Promise<void>((r) => pageServer.listen(0, '127.0.0.1', r));
  pageOrigin = `http://localhost:${(pageServer.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((r) => mediaServer.close(() => r()));
  await new Promise<void>((r) => pageServer.close(() => r()));
});

test('THE FAILURE — the draw succeeds, and reading the pixels back throws', async ({ page }) => {
  await page.goto(pageOrigin);

  const result = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = `${src}/frame.png`;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d')!;

    // This does NOT throw. A helper that stops here reports a successful "capture".
    ctx.drawImage(img, 0, 0);

    try {
      canvas.toDataURL();
      return { drew: true, read: 'ok' };
    } catch (e) {
      return { drew: true, read: (e as Error).name };
    }
  }, mediaOrigin);

  expect(result.drew).toBe(true);
  expect(result.read).toBe('SecurityError');
});

test('THE FIX — assert on player/media state instead of pixels', async ({ page }) => {
  await page.goto(pageOrigin);

  // The protected-content answer is not "capture harder", it is to assert on what the element
  // reports about itself. Nothing here touches pixels, so nothing here can taint.
  const state = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = `${src}/frame.png`;
    await img.decode();
    return { complete: img.complete, width: img.naturalWidth };
  }, mediaOrigin);

  expect(state.complete).toBe(true);
  expect(state.width).toBeGreaterThan(0);
});
