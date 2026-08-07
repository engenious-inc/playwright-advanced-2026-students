import { test, expect } from '../../shared/fixtures/index.js';
import { MockTubi, installMockTubiShell } from '../../shared/anchor-helpers/tubi/mock-endpoints.js';
import {
  TEN_CATEGORIES,
  ELEVEN_CATEGORIES_DRIFTED,
  RECOMMENDED_FOR_YOU,
  PERSONALIZED_STRIP,
  THREE_CATEGORIES_OVERRIDE,
} from './fixtures/categories.js';
import type { Route } from '@playwright/test';

// The committed proof behind 4.C's "mocks lie to you" beat — the same relationship
// tests/m03/3b-fixtures.spec.ts has to 3.B/3.C: this file is the non-negotiable evidence the
// contrast is genuinely true, not just narrated on camera.

test('4.B baseline: mocked test asserts the fixture it was given, and it is deterministic', async ({
  page,
}) => {
  await installMockTubiShell(page, TEN_CATEGORIES);
  await page.goto(MockTubi.pageUrl);

  await expect(page.locator('#categories-root').getByRole('region')).toHaveCount(10);
  await expect(page.getByRole('region', { name: RECOMMENDED_FOR_YOU.name })).toBeVisible();
});

test('4.C: the same known-item assertion stays green when the underlying data has drifted (mocks lie)', async ({
  page,
}) => {
  await installMockTubiShell(page, TEN_CATEGORIES);
  // A more specific route registered after the baseline wins — page.route's real
  // last-registered-first precedence, standing in for "production silently added a category."
  await page.route(MockTubi.categoriesPattern, async (route) => {
    await route.fulfill({ status: 200, json: ELEVEN_CATEGORIES_DRIFTED });
  });

  await page.goto(MockTubi.pageUrl);

  // This is the lie: the assertion only checks that a category the test author already knew
  // about is present. It says nothing about how many categories there are, so an additive
  // drift — production shipped an 11th category — sails straight through.
  await expect(page.getByRole('region', { name: RECOMMENDED_FOR_YOU.name })).toBeVisible();
});

test('4.C: a count-based assertion would have caught the same drift', async ({ page }) => {
  await installMockTubiShell(page, TEN_CATEGORIES);
  await page.route(MockTubi.categoriesPattern, async (route) => {
    await route.fulfill({ status: 200, json: ELEVEN_CATEGORIES_DRIFTED });
  });

  await page.goto(MockTubi.pageUrl);

  // Proves the drift was real and catchable in principle — what makes the previous test's
  // "lie" a provable claim rather than a rhetorical one.
  await expect(page.locator('#categories-root').getByRole('region')).toHaveCount(11);
});

// 4.D's claim — "pinning one endpoint changes that row and nothing else" — needs its own proof:
// every test above exercises only the categories endpoint, so none of them shows that a
// NON-overridden endpoint keeps answering from the baseline. The category rows are scoped to
// #categories-root so the count stays 10 whether or not the personalized strip is present.

test('4.D baseline: without the pin, the personalized strip does not render', async ({ page }) => {
  await installMockTubiShell(page, TEN_CATEGORIES);
  await page.goto(MockTubi.pageUrl);

  await expect(page.getByRole('region', { name: 'Continue Watching' })).toHaveCount(0);
  await expect(page.locator('#categories-root').getByRole('region')).toHaveCount(10);
});

test('4.D: pinning only personalization changes that row and nothing else', async ({ page }) => {
  await installMockTubiShell(page, TEN_CATEGORIES);
  // One more specific route, registered after the baseline so it wins — and it is the ONLY
  // endpoint this test overrides. No blanket '**/*' handler.
  await page.route(MockTubi.personalizationPattern, async (route) => {
    await route.fulfill({ status: 200, json: PERSONALIZED_STRIP });
  });

  await page.goto(MockTubi.pageUrl);

  await expect(page.getByRole('region', { name: 'Continue Watching' })).toBeVisible();
  // The proof of "partial": the endpoint we never touched still answers with the baseline's ten.
  await expect(page.locator('#categories-root').getByRole('region')).toHaveCount(10);
});

// 4.E's claims need their own proof: nothing above ever registers a BROAD handler, calls
// route.fallback(), or shows the failure mode — the three things the lecture asserts on camera.

test('4.E: two handlers on the same pattern — the one registered LAST answers', async ({
  page,
}) => {
  await installMockTubiShell(page, TEN_CATEGORIES);
  await page.route(MockTubi.categoriesPattern, async (route) => {
    await route.fulfill({ status: 200, json: THREE_CATEGORIES_OVERRIDE });
  });

  await page.goto(MockTubi.pageUrl);

  await expect(page.locator('#categories-root').getByRole('region')).toHaveCount(3);
  await expect(page.getByRole('region', { name: 'Tonight Only' })).toBeVisible();
  // The baseline lost outright — it never got to answer.
  await expect(page.getByRole('region', { name: 'Recommended For You' })).toHaveCount(0);
});

// Disproves the claim that a broad suite-level route means per-test routes never fire. Breadth
// is irrelevant; registration order is everything. Keep this test — the wrong version of this
// claim shipped in the lesson doc and in the published lesson description.
test('4.E: breadth does not decide — a BROAD handler registered FIRST still loses', async ({
  page,
}) => {
  await installMockTubiShell(page, TEN_CATEGORIES);
  await page.route(MockTubi.broadOzPattern, async (route) => {
    await route.fulfill({ status: 200, json: [] });
  });
  await page.route(MockTubi.categoriesPattern, async (route) => {
    await route.fulfill({ status: 200, json: THREE_CATEGORIES_OVERRIDE });
  });

  await page.goto(MockTubi.pageUrl);

  await expect(page.locator('#categories-root').getByRole('region')).toHaveCount(3);
});

test('4.E: the ordering bug — a broad handler registered LAST swallows the specific mock', async ({
  page,
}) => {
  await installMockTubiShell(page, TEN_CATEGORIES);
  await page.route(MockTubi.categoriesPattern, async (route) => {
    await route.fulfill({ status: 200, json: THREE_CATEGORIES_OVERRIDE });
  });
  // Registered after the specific one, so it answers first — and nothing errors.
  await page.route(MockTubi.broadOzPattern, async (route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.goto(MockTubi.pageUrl);

  await expect(page.locator('#categories-root').getByRole('region')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Tonight Only' })).toHaveCount(0);
});

test('4.E: route.fallback() from the broad handler reaches the handler registered before it', async ({
  page,
}) => {
  await installMockTubiShell(page, TEN_CATEGORIES);
  await page.route(MockTubi.categoriesPattern, async (route) => {
    await route.fulfill({ status: 200, json: THREE_CATEGORIES_OVERRIDE });
  });
  await page.route(MockTubi.broadOzPattern, async (route) => {
    if (route.request().url().includes(MockTubi.personalizationPath)) {
      await route.fulfill({ status: 200, json: PERSONALIZED_STRIP });
      return;
    }
    await route.fallback();
  });

  await page.goto(MockTubi.pageUrl);

  // The broad handler answered the endpoint it owns...
  await expect(page.getByRole('region', { name: 'Continue Watching' })).toBeVisible();
  // ...and deferred the rest to the handler registered BEFORE it — the override, not the
  // baseline's ten. That direction is the whole claim: fallback goes backwards, not forwards.
  await expect(page.locator('#categories-root').getByRole('region')).toHaveCount(3);
  await expect(page.getByRole('region', { name: 'Tonight Only' })).toBeVisible();
});

// The capture cuts the bug beat into the fix beat on one page, which only works if unroute
// retires exactly one handler and leaves the baseline's four alone.
test('4.E: unroute(pattern, handler) retires ONLY that handler', async ({ page }) => {
  await installMockTubiShell(page, TEN_CATEGORIES);
  await page.route(MockTubi.categoriesPattern, async (route) => {
    await route.fulfill({ status: 200, json: THREE_CATEGORIES_OVERRIDE });
  });
  const swallowEverything = async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  };
  await page.route(MockTubi.broadOzPattern, swallowEverything);

  await page.goto(MockTubi.pageUrl);
  await expect(page.locator('#categories-root').getByRole('region')).toHaveCount(0);

  await page.unroute(MockTubi.broadOzPattern, swallowEverything);
  await page.reload();

  await expect(page.locator('#categories-root').getByRole('region')).toHaveCount(3);
});

// 4.F's CORS claim needs its own proof: every test above is same-origin, so none of them shows
// that a fulfilled CROSS-origin response skips the browser's CORS check entirely. A real endpoint
// answering with no Access-Control-Allow-Origin would make the fetch below reject outright.
test('4.F: a fulfilled cross-origin mock is never CORS-checked, and no preflight is sent', async ({
  page,
}) => {
  await installMockTubiShell(page, TEN_CATEGORIES);

  const methodsRouted: string[] = [];
  await page.route(MockTubi.crossOriginPattern, async (route) => {
    methodsRouted.push(route.request().method());
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.goto(MockTubi.pageUrl);

  // A custom request header is exactly what makes a real browser send an OPTIONS preflight.
  const result = await page.evaluate(async (url) => {
    const res = await fetch(url, { headers: { 'x-tubi-client': 'web' } });
    return { status: res.status, body: await res.text() };
  }, MockTubi.crossOriginApiUrl);

  // No try/catch on purpose: if the fulfilled response WERE CORS-checked, page.evaluate would
  // reject and this test would fail loudly rather than quietly assert on a caught error.
  expect(result).toEqual({ status: 200, body: '{"ok":true}' });
  // The preflight never existed, so a broken Access-Control-Allow-* config on the real endpoint
  // is invisible to every test that fulfills this route.
  expect(methodsRouted).toEqual(['GET']);
});
