import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  checkNoWaitForTimeout,
  checkNoRawLocatorOutsideAdapter,
  checkNoHardcodedUrl,
  checkNoExplicitAny,
  checkNoFloatingPlaywrightCall,
  checkNoPageObjectInstantiationBypass,
  runChecks,
  getViolations,
} from './enforce-agent-rules.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI_PATH = path.join(ROOT, 'scripts/enforce-agent-rules.mjs');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

// Read once, reused by every test below that needs a real, currently-passing adapter file.
const JUICE_SHOP_HOME_PATH = 'shared/anchor-helpers/juice-shop/JuiceShopHomePage.ts';
const JUICE_SHOP_HOME_CONTENT = readRepoFile(JUICE_SHOP_HOME_PATH);

// A second real adapter file whose loginAsDefaultAdmin() method awaits a chained call across
// three lines (`await this.page\n  .getByLabel(...)\n  .fill(...)`) — the regression fixture
// for checkNoFloatingPlaywrightCall's statement-continuation tracking, and (separately) a real
// "one adapter composing another" instantiation (`new JuiceShopHomePage(this.page)`).
const JUICE_SHOP_LOGIN_PATH = 'shared/anchor-helpers/juice-shop/JuiceShopLoginPage.ts';
const JUICE_SHOP_LOGIN_CONTENT = readRepoFile(JUICE_SHOP_LOGIN_PATH);

function runCli(payload) {
  const result = spawnSync('node', [CLI_PATH], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
  });
  return result;
}

// --- checkNoWaitForTimeout ---------------------------------------------------------------

test('checkNoWaitForTimeout flags a known-bad waitForTimeout call', () => {
  const bad = `await page.waitForTimeout(2000);`;
  const result = checkNoWaitForTimeout('tests/m99/demo.spec.ts', bad);
  assert.equal(result.violated, true);
  assert.equal(result.rule, 'no-wait-for-timeout');
  assert.match(result.message, /waitForTimeout/);
});

test('checkNoWaitForTimeout does not flag a real passing adapter file', () => {
  const result = checkNoWaitForTimeout(JUICE_SHOP_HOME_PATH, JUICE_SHOP_HOME_CONTENT);
  assert.equal(result.violated, false);
});

// --- checkNoRawLocatorOutsideAdapter -----------------------------------------------------

test('checkNoRawLocatorOutsideAdapter flags a raw locator in a test file', () => {
  const bad = `const row = page.locator('.product-row');`;
  const result = checkNoRawLocatorOutsideAdapter('tests/m99/demo.spec.ts', bad);
  assert.equal(result.violated, true);
  assert.equal(result.rule, 'no-raw-locator-outside-adapter');
});

test('checkNoRawLocatorOutsideAdapter allows the same pattern genuinely inside an adapter file', () => {
  assert.match(JUICE_SHOP_HOME_CONTENT, /\.locator\(/); // sanity: this adapter really does use a raw locator
  const result = checkNoRawLocatorOutsideAdapter(JUICE_SHOP_HOME_PATH, JUICE_SHOP_HOME_CONTENT);
  assert.equal(result.violated, false);
});

// --- checkNoHardcodedUrl ------------------------------------------------------------------

test('checkNoHardcodedUrl flags a hardcoded URL in a test file', () => {
  const bad = `await page.goto('https://example.com/login');`;
  const result = checkNoHardcodedUrl('tests/m99/demo.spec.ts', bad);
  assert.equal(result.violated, true);
  assert.equal(result.rule, 'no-hardcoded-url');
});

test('checkNoHardcodedUrl allows the same literal in an adapter endpoints file', () => {
  const good = readRepoFile('shared/anchor-helpers/tubi/endpoints.ts');
  const result = checkNoHardcodedUrl('shared/anchor-helpers/tubi/endpoints.ts', good);
  assert.equal(result.violated, false);
});

// --- checkNoExplicitAny -------------------------------------------------------------------

test('checkNoExplicitAny flags a `: any` annotation', () => {
  const bad = `function parse(input: any): void {}`;
  const result = checkNoExplicitAny('tests/m99/demo.spec.ts', bad);
  assert.equal(result.violated, true);
  assert.equal(result.rule, 'no-explicit-any');
});

test('checkNoExplicitAny flags `Array<any>`', () => {
  const bad = `const items: Array<any> = [];`;
  assert.equal(checkNoExplicitAny('tests/m99/demo.spec.ts', bad).violated, true);
});

test('checkNoExplicitAny flags `Foo | any`', () => {
  const bad = `let x: Foo | any;`;
  assert.equal(checkNoExplicitAny('tests/m99/demo.spec.ts', bad).violated, true);
});

test('checkNoExplicitAny flags `x as any`', () => {
  const bad = `const y = x as any;`;
  assert.equal(checkNoExplicitAny('tests/m99/demo.spec.ts', bad).violated, true);
});

test('checkNoExplicitAny flags `any` as a non-first generic argument (Record<string, any>)', () => {
  const bad = `function f(x: Record<string, any>) {}`;
  assert.equal(checkNoExplicitAny('tests/m99/demo.spec.ts', bad).violated, true);
});

test('checkNoExplicitAny flags `any` in a generic default (`<T = any>`)', () => {
  const bad = `function f<T = any>(x: T) {}`;
  assert.equal(checkNoExplicitAny('tests/m99/demo.spec.ts', bad).violated, true);
});

test('checkNoExplicitAny does not flag a real passing file typed with unknown', () => {
  const good = readRepoFile('shared/BasePage.ts');
  assert.doesNotMatch(good, /:\s*any\b/);
  const result = checkNoExplicitAny('shared/BasePage.ts', good);
  assert.equal(result.violated, false);
});

test('checkNoExplicitAny does not flag prose mentioning "any" after a comma in a comment', () => {
  const good = `// this check covers every form, any of the six patterns really`;
  assert.equal(checkNoExplicitAny('tests/m99/demo.spec.ts', good).violated, false);
});

// --- checkNoFloatingPlaywrightCall ---------------------------------------------------------

test('checkNoFloatingPlaywrightCall flags an unawaited click', () => {
  const bad = `page.click('#submit-button');`;
  const result = checkNoFloatingPlaywrightCall('tests/m99/demo.spec.ts', bad);
  assert.equal(result.violated, true);
  assert.equal(result.rule, 'no-floating-playwright-call');
});

test('checkNoFloatingPlaywrightCall does not flag a real file where every call is awaited', () => {
  const result = checkNoFloatingPlaywrightCall(JUICE_SHOP_HOME_PATH, JUICE_SHOP_HOME_CONTENT);
  assert.equal(result.violated, false);
});

test('checkNoFloatingPlaywrightCall does not flag a real awaited call chained across multiple lines', () => {
  // Regression fixture: JuiceShopLoginPage.loginAsDefaultAdmin() awaits
  // `this.page.getByLabel(...).fill(...)` across three lines (Prettier-wrapped) — a purely
  // per-line "does this line contain await" check misreads the `.fill(...)` continuation line
  // as unawaited even though the statement it belongs to starts with `await`.
  assert.match(JUICE_SHOP_LOGIN_CONTENT, /await this\.page\s*\n\s*\.getByLabel/);
  const result = checkNoFloatingPlaywrightCall(JUICE_SHOP_LOGIN_PATH, JUICE_SHOP_LOGIN_CONTENT);
  assert.equal(result.violated, false);
});

test('checkNoFloatingPlaywrightCall skips a comment line naming a Playwright action method', () => {
  const good = `// remember: call page.click('#foo') if this ever needs a manual trigger`;
  assert.equal(checkNoFloatingPlaywrightCall('tests/m99/demo.spec.ts', good).violated, false);
});

// --- checkNoPageObjectInstantiationBypass --------------------------------------------------

test('checkNoPageObjectInstantiationBypass flags direct instantiation in a test file', () => {
  // Grounded in a real pre-existing pattern (tests/hermetic/tubi-home.spec.ts uses this exact
  // shape) — this hook would flag it as a genuine pre-existing gap, not a false positive.
  const bad = `const home = new TubiHomePage(page);`;
  const result = checkNoPageObjectInstantiationBypass('tests/m99/demo.spec.ts', bad);
  assert.equal(result.violated, true);
  assert.equal(result.rule, 'no-page-object-instantiation-bypass');
});

test('checkNoPageObjectInstantiationBypass allows the sanctioned instantiation inside shared/fixtures/index.ts', () => {
  const good = readRepoFile('shared/fixtures/index.ts');
  assert.match(good, /new TubiHomePage\(/); // sanity: this really is where it happens
  const result = checkNoPageObjectInstantiationBypass('shared/fixtures/index.ts', good);
  assert.equal(result.violated, false);
});

test('checkNoPageObjectInstantiationBypass allows instantiation inside another generated fixture-definition file', () => {
  const good = readRepoFile('examples/m08-manifest/generated/fixtures.ts');
  assert.match(good, /new TubiLiveTvPage\(/); // sanity
  const result = checkNoPageObjectInstantiationBypass(
    'examples/m08-manifest/generated/fixtures.ts',
    good,
  );
  assert.equal(result.violated, false);
});

test('checkNoPageObjectInstantiationBypass allows one adapter composing another adapter', () => {
  // Real, pre-existing pattern: JuiceShopLoginPage.goto() instantiates JuiceShopHomePage
  // directly to reuse its dismissBanners() helper — the exact "one adapter composing another"
  // exemption AE2/R7 calls for, distinct from the fixture-definition-file exemption above.
  assert.match(JUICE_SHOP_LOGIN_CONTENT, /new JuiceShopHomePage\(this\.page\)/);
  const result = checkNoPageObjectInstantiationBypass(
    JUICE_SHOP_LOGIN_PATH,
    JUICE_SHOP_LOGIN_CONTENT,
  );
  assert.equal(result.violated, false);
});

// --- Integration: a clean file trips nothing -----------------------------------------------

test('a small clean adapter-shaped file produces zero violations across all six checks', () => {
  const clean = `
import type { Locator } from '@playwright/test';
import { BasePage } from '../../BasePage.js';
import { TubiEndpoints } from './endpoints.js';

export class ExamplePage extends BasePage {
  readonly path = '/';

  async goto(): Promise<void> {
    await this.page.goto(TubiEndpoints.baseUrl + this.path);
    await this.waitForReady();
  }

  get heroTile(): Locator {
    return this.page.locator('div.web-content-tile');
  }
}
`;
  const violations = getViolations('shared/anchor-helpers/example/ExamplePage.ts', clean);
  assert.deepEqual(violations, []);
});

test('runChecks always returns all six results, violated or not', () => {
  const results = runChecks('tests/m99/demo.spec.ts', 'const x = 1;');
  assert.equal(results.length, 6);
  for (const result of results) {
    assert.equal(typeof result.rule, 'string');
    assert.equal(typeof result.violated, 'boolean');
  }
});

test('runChecks/getViolations produce zero violations for a non-source file, even with anti-pattern-looking text', () => {
  // A lecture doc that legitimately talks *about* these patterns (this is real text from
  // docs/modules/M09-instruction-files/9D-lint-safety-net.md) must not itself be blocked if
  // this hook is ever wired live — only .ts/.tsx/.js/.jsx/.mjs/.cjs writes are in scope.
  const docContent = 'Watch it work: `page.waitForTimeout(2000)` — the check flags `any` types.';
  const violations = getViolations(
    'docs/modules/M09-instruction-files/9D-lint-safety-net.md',
    docContent,
  );
  assert.deepEqual(violations, []);
});

// --- CLI entry point (end-to-end via stdin/exit code) --------------------------------------

test('CLI blocks a real Edit-shaped payload (old_string/new_string, no content field)', () => {
  const result = runCli({
    tool_name: 'Edit',
    tool_input: {
      file_path: 'tests/m99/demo.spec.ts',
      old_string: 'await page.waitForLoadState();',
      new_string: 'await page.waitForTimeout(2000);',
    },
  });
  assert.equal(result.status, 2);
  const parsed = JSON.parse(result.stderr);
  assert.equal(parsed.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(parsed.systemMessage, /no-wait-for-timeout/);
});

test('CLI allows a real Write-shaped known-good payload', () => {
  const result = runCli({
    tool_name: 'Write',
    tool_input: { file_path: JUICE_SHOP_HOME_PATH, content: JUICE_SHOP_HOME_CONTENT },
  });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
});

test('CLI blocks a MultiEdit-shaped payload with a violation in one edit', () => {
  const result = runCli({
    tool_name: 'MultiEdit',
    tool_input: {
      file_path: 'tests/m99/demo.spec.ts',
      edits: [
        { old_string: 'a', new_string: 'const x = 1;' },
        { old_string: 'b', new_string: 'const home = new TubiHomePage(page);' },
      ],
    },
  });
  assert.equal(result.status, 2);
  assert.match(JSON.parse(result.stderr).systemMessage, /no-page-object-instantiation-bypass/);
});

test('CLI allows a non-target tool (Read) without crashing', () => {
  const result = runCli({ tool_name: 'Read', tool_input: { file_path: 'foo.ts' } });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
});

test('CLI allows malformed JSON on stdin without crashing', () => {
  const result = spawnSync('node', [CLI_PATH], { input: 'not json', encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
});
