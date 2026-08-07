import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type Category = { id: number; name: string; slug: string };

/**
 * Isolated mock host for the M04 page.route mocking lessons — not a production anchor URL.
 * Non-resolving hostname, fully fulfilled via page.route (page shell, posters, API calls), so
 * no real DNS/network is ever touched — same pattern as shared/anchor-helpers/m06/mock-endpoints.ts.
 */
export const MockTubi = {
  pageUrl: 'http://tubi.mock.test/',
  pageRoutePattern: 'http://tubi.mock.test/',
  categoriesPattern: '**/oz/categories*',
  personalizationPattern: '**/oz/personalization*',
  // 4.E: a deliberately BROAD pattern — the one a "hermetic guard" reaches for. Whether it
  // swallows a more specific mock depends only on REGISTRATION ORDER, never on its breadth.
  broadOzPattern: '**/oz/**',
  personalizationPath: '/oz/personalization',
  // 4.F: a genuinely CROSS-origin endpoint (different host ⇒ different origin), still
  // non-resolving. Used to prove route.fulfill() bypasses the browser's CORS check outright.
  crossOriginApiUrl: 'http://api.tubi.mock.test/oz/preferences',
  crossOriginPattern: '**/api.tubi.mock.test/**',
  postersPattern: '**/posters/*',
} as const;

const shellHtml = readFileSync(
  fileURLToPath(new URL('../../../tests/m04/fixtures/tubi-home-shell.html', import.meta.url)),
  'utf-8',
);

const postersDir = fileURLToPath(new URL('../../../tests/m03/fixtures/posters/', import.meta.url));

/**
 * Registers the baseline routes every M04 demo starts from: the page shell, real poster
 * images (reused from M03's recon), and `categories` as the default `**​/oz/categories*`
 * response. Individual tests register a more specific route for `**​/oz/categories*` (or
 * `**​/oz/personalization*`) *after* calling this — genuine page.route last-registered-wins
 * precedence, not a simulation of it. `categories` is passed in (not imported from a fixture
 * module here) so this shared helper doesn't depend on test-owned fixture data.
 */
export async function installMockTubiShell(page: Page, categories: Category[]): Promise<void> {
  await page.route(MockTubi.pageRoutePattern, async (route) => {
    await route.fulfill({ contentType: 'text/html', body: shellHtml });
  });

  await page.route(MockTubi.postersPattern, async (route) => {
    const filename = new URL(route.request().url()).pathname.split('/').pop() ?? '';
    const ext = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const body = readFileSync(`${postersDir}${filename}`);
    await route.fulfill({ contentType: ext, body });
  });

  await page.route(MockTubi.categoriesPattern, async (route) => {
    await route.fulfill({ status: 200, json: categories });
  });

  await page.route(MockTubi.personalizationPattern, async (route) => {
    await route.fulfill({ status: 200, json: { items: [] } });
  });
}
