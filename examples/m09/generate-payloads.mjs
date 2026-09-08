#!/usr/bin/env node
// Regenerates examples/m09/payloads/ — one synthetic Claude Code PreToolUse payload per
// violation category scripts/enforce-agent-rules.mjs checks, plus one known-good payload
// sourced from a real, currently-passing adapter file (not a fabricated log). See
// examples/m09/README.md for what these are for and how they're used.
//
// Usage: node examples/m09/generate-payloads.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = path.join(ROOT, 'examples/m09/payloads');

function write(name, payload) {
  fs.writeFileSync(path.join(OUT_DIR, name), `${JSON.stringify(payload, null, 2)}\n`);
}

write('01-wait-for-timeout.json', {
  tool_name: 'Write',
  tool_input: {
    file_path: 'tests/m09/demo/waits.spec.ts',
    content: `import { test, expect } from '../../../shared/fixtures/index.js';

test('loads the results panel', async ({ tubiHome }) => {
  await tubiHome.goto();
  await tubiHome.page.waitForTimeout(2000);
  await expect(tubiHome.contentTiles.first()).toBeVisible();
});
`,
  },
});

write('02-raw-locator-outside-adapter.json', {
  tool_name: 'Write',
  tool_input: {
    file_path: 'tests/m09/demo/raw-locator.spec.ts',
    content: `import { test, expect } from '../../../shared/fixtures/index.js';

test('shows the first content tile', async ({ tubiHome, page }) => {
  await tubiHome.goto();
  const tile = page.locator('div.web-content-tile').first();
  await expect(tile).toBeVisible();
});
`,
  },
});

write('03-hardcoded-url.json', {
  tool_name: 'Write',
  tool_input: {
    file_path: 'tests/m09/demo/hardcoded-url.spec.ts',
    content: `import { test, expect } from '../../../shared/fixtures/index.js';

test('navigates to Tubi directly', async ({ page }) => {
  await page.goto('https://tubitv.com/');
  await expect(page).toHaveURL(/tubitv\\.com/);
});
`,
  },
});

write('04-explicit-any.json', {
  tool_name: 'Write',
  tool_input: {
    file_path: 'tests/m09/demo/any-type.spec.ts',
    content: `import { test, expect } from '../../../shared/fixtures/index.js';

function parseResponse(body: any): string {
  return body.title;
}

test('parses the response body', async ({ tubiHome }) => {
  await tubiHome.goto();
  expect(parseResponse({ title: 'ok' })).toBe('ok');
});
`,
  },
});

write('05-floating-playwright-call.json', {
  tool_name: 'Write',
  tool_input: {
    file_path: 'tests/m09/demo/floating-call.spec.ts',
    content: `import { test, expect } from '../../../shared/fixtures/index.js';

test('clicks the search entry point', async ({ tubiHome }) => {
  await tubiHome.goto();
  tubiHome.page.click('a[href="/search"]');
  await expect(tubiHome.page).toHaveURL(/search/);
});
`,
  },
});

write('06-page-object-instantiation-bypass.json', {
  tool_name: 'Write',
  tool_input: {
    file_path: 'tests/m09/demo/direct-instantiation.spec.ts',
    content: `import { test } from '@playwright/test';
import { TubiHomePage } from '../../../shared/anchor-helpers/tubi/TubiHomePage.js';

test('loads home directly, bypassing the fixture', async ({ page }) => {
  const home = new TubiHomePage(page);
  await home.goto();
});
`,
  },
});

const knownGoodPath = 'shared/anchor-helpers/juice-shop/JuiceShopHomePage.ts';
const knownGood = fs.readFileSync(path.join(ROOT, knownGoodPath), 'utf8');
write('07-known-good.json', {
  // Write, not Edit: Edit's real tool_input carries old_string/new_string, never a full-file
  // content field (see scripts/enforce-agent-rules.mjs's extractFileAndContent) — Write is the
  // one real tool shape that actually carries a whole file body this way.
  tool_name: 'Write',
  tool_input: {
    file_path: knownGoodPath,
    content: knownGood,
  },
});

console.log('Regenerated 7 payload files in examples/m09/payloads/');
