import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AddressInfo } from 'node:net';

export type CapturedCategory = { id: number; name: string };

/**
 * The category-browse data 5.B/5.C capture — same shape M04's mock categories use, so the
 * "category-browse flow" the outline describes reads consistently across modules.
 */
export const CATEGORY_BROWSE_CATEGORIES: CapturedCategory[] = [
  { id: 1, name: 'Recommended For You' },
  { id: 2, name: 'Movie Night' },
  { id: 3, name: 'Trending Now' },
];

// Real poster art, reused from the M03 recon the same way M04's mock shell does
// (tests/m04/fixtures/tubi-home-shell.html) — a visually real streaming page, not a blank one,
// for the on-camera capture. `#categories` (checked by the hermetic tests below) stays a plain
// text summary; the poster grid is additive, layered underneath it.
const POSTERS = [
  'now-you-see-me.jpg',
  'rango.jpg',
  'shark-tale.jpg',
  'bad-teacher.png',
  'transformers.png',
  'megamind.png',
];
const postersDir = fileURLToPath(new URL('../../m03/fixtures/posters/', import.meta.url));

function shellHtml(categories: CapturedCategory[]): string {
  const rows = categories
    .map((cat, rowIndex) => {
      const tiles = [0, 1, 2, 3]
        .map((i) => POSTERS[(rowIndex * 4 + i) % POSTERS.length])
        .map((poster) => `<div class="tile"><img src="/posters/${poster}" alt="" /></div>`)
        .join('');
      return `<section class="row"><h2>${cat.name}</h2><div class="carousel">${tiles}</div></section>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0d0d10; color: #fff; font-family: Inter, system-ui, -apple-system, sans-serif; padding: 24px 40px 60px; }
  header { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 20px; }
  #categories { font-size: 14px; opacity: 0.55; margin-bottom: 24px; }
  .row h2 { font-size: 24px; font-weight: 700; margin: 24px 0 14px; }
  .carousel { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
  .tile img { display: block; width: 100%; aspect-ratio: 2 / 3; object-fit: cover; border-radius: 8px;
    background: #23232b; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5); }
</style></head>
<body>
  <header>local-anchor</header>
  <div id="categories">loading</div>
  ${rows}
  <script>
    fetch('/api/categories').then((r) => r.json()).then((cats) => {
      document.getElementById('categories').textContent = cats.map((c) => c.name).join(', ');
    });
  </script>
</body></html>`;
}

/**
 * A real, local HTTP server standing in for the anchor site during 5.B/5.C's HAR/trace capture —
 * same reason examples/where-this-breaks/m05-har-leaks-pii uses one: `routeFromHAR` and
 * `tracing.startHar` need a genuine network round-trip to capture something. A local server gives
 * that without touching tubitv.com or hand-fabricating a HAR file's contents.
 *
 * Also serves `/other-path`, a second real endpoint the capture never visits — 5.B's proof that
 * `notFound: 'abort'` (the default) rejects a replayed request outside the HAR, even though the
 * live server is fully capable of answering it.
 */
export async function startCategoryBrowseServer(
  categories: CapturedCategory[],
): Promise<{ server: Server; origin: string }> {
  const server = createServer((req, res) => {
    if (req.url?.startsWith('/api/categories')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(categories));
      return;
    }
    if (req.url?.startsWith('/posters/')) {
      const filename = req.url.slice('/posters/'.length);
      try {
        const ext = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
        const body = readFileSync(`${postersDir}${filename}`);
        res.writeHead(200, { 'content-type': ext }).end(body);
      } catch {
        res.writeHead(404).end();
      }
      return;
    }
    if (req.url === '/other-path') {
      res.writeHead(200, { 'content-type': 'text/plain' }).end('reachable, but never captured');
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html' }).end(shellHtml(categories));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { server, origin };
}

export function stopServer(server: Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}
