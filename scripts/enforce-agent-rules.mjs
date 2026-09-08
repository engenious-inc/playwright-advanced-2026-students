#!/usr/bin/env node
// Standalone example: mechanically enforces six of AGENTS.md's "Forbidden patterns" at
// write time, rather than at lint/CI time. Four of the six are already lint-enforced today
// (waitForTimeout, hardcoded URLs, `any`, unawaited Playwright calls) — this script
// re-implements them so one place covers all six. The other two are the actual point of
// this example: raw CSS/XPath selectors outside adapters, which AGENTS.md and
// docs/modules/M09-instruction-files/9D-lint-safety-net.md both currently name as
// "enforced by review" (not mechanically lintable), and manual page-object instantiation
// that bypasses `shared/fixtures/index.ts`, which has no lint-vs-review categorization at
// all today — this is its first mechanical enforcement of any kind.
//
// Every check is plain string/pattern matching, not an AST parser — matching every other
// meta-check script in this repo (scripts/lint-doc-paths.mjs, scripts/lint-decisions.mjs,
// scripts/hf/alpha-master.mjs). That means each check is a documented heuristic, not a
// type-checker: see the comment on checkNoFloatingPlaywrightCall for its known limits.
//
// NOT wired into `.claude/settings.json`, and NOT part of `npm run verify` — run its tests
// explicitly via `npm run test:enforce-agent-rules`. Live, repo-wide wiring is a separate
// decision made after this standalone example has seen real use — see
// docs/plans/2026-08-30-001-feat-agentic-playwright-inspired-improvements-plan.md (R9).
// scripts/audit-student-sync.mjs already establishes the same shape: a real, working check
// with its own discoverable script, deliberately kept out of the always-run gate for a
// documented reason.
//
// Usage as a Claude Code PreToolUse hook (once wired — not currently):
//   echo '<PreToolUse JSON>' | node scripts/enforce-agent-rules.mjs
// Reads tool_name / tool_input.file_path from stdin, plus whichever content field that tool
// actually carries — tool_input.content for Write, tool_input.new_string for Edit, or
// tool_input.edits[].new_string (concatenated, best-effort) for MultiEdit. Exit 0 = allow.
// Exit 2 = block, with `{hookSpecificOutput, systemMessage}` JSON on stderr — matching the
// convention in the Claude Code hook-development skill's examples/validate-write.sh.
//
// Demo harness (synthetic payloads, for recording — not this file's correctness tests):
// examples/m09/README.md and examples/m09/payloads/.

import path from 'node:path';

// path.posix.normalize collapses `..`/`.` segments so a crafted path like
// `shared/anchor-helpers/../../tests/evil.spec.ts` resolves to its real logical location
// (`tests/evil.spec.ts`) before any classifier substring-matches it — otherwise a traversal
// segment could spoof isAdapterFile/isFixtureDefinitionFile/isTestFile into exempting a file
// that isn't actually inside the directory its path claims to be in.
function normalizePath(filePath) {
  return path.posix.normalize(filePath.replaceAll('\\', '/'));
}

// Only these AGENTS.md forbidden patterns apply to actual source/test files — running them
// against docs, JSON, or other non-code writes produces false positives (e.g. this repo's own
// lecture prose describing `page.waitForTimeout(...)` as an anti-pattern would otherwise trip
// the very check it's teaching about).
const CHECKABLE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

function isCheckableSourceFile(filePath) {
  const normalized = normalizePath(filePath);
  return CHECKABLE_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

// Removes block (`/* ... */`) and whole-line (`//...`) comments before a check scans content,
// so prose that merely *describes* a forbidden pattern (this file's own docstrings are the
// concrete case that surfaced this) doesn't trip the check it's explaining. Deliberately only
// strips a `//` line when the line's trimmed content starts with it — a mid-line `//` (e.g.
// inside a checked `https://` URL literal) is left alone, so this can't truncate the very
// string checkNoHardcodedUrl is looking for.
function stripCommentsForScanning(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
}

const ADAPTER_DIR = 'shared/anchor-helpers/';

function isAdapterFile(filePath) {
  return normalizePath(filePath).includes(ADAPTER_DIR);
}

function isFixtureDefinitionFile(filePath) {
  const path = normalizePath(filePath);
  return (
    path.includes('/fixtures/') || path.endsWith('fixtures.ts') || path.endsWith('fixtures.mjs')
  );
}

function isTestFile(filePath) {
  const path = normalizePath(filePath);
  return path.startsWith('tests/') || path.includes('/tests/');
}

/** `page.waitForTimeout(...)` — the single most common AI-generated anti-pattern (9.D). */
export function checkNoWaitForTimeout(_filePath, content) {
  const violated = /\.waitForTimeout\s*\(/.test(stripCommentsForScanning(content));
  return {
    rule: 'no-wait-for-timeout',
    violated,
    message: violated
      ? 'page.waitForTimeout(...) is forbidden — use a web-first assertion, locator auto-wait, or page.waitForLoadState (AGENTS.md; lint rule playwright/no-wait-for-timeout).'
      : undefined,
  };
}

/**
 * Raw CSS/XPath selectors (`.locator(...)`) are allowed only inside `shared/anchor-helpers/`
 * adapters (AGENTS.md rule 4). Today this is "enforced by review" only — this is the first
 * mechanical check for it.
 */
export function checkNoRawLocatorOutsideAdapter(filePath, content) {
  if (isAdapterFile(filePath)) {
    return { rule: 'no-raw-locator-outside-adapter', violated: false };
  }
  const violated = /\.locator\s*\(/.test(stripCommentsForScanning(content));
  return {
    rule: 'no-raw-locator-outside-adapter',
    violated,
    message: violated
      ? 'Raw page.locator(...) selectors are allowed only inside shared/anchor-helpers/ adapters (AGENTS.md rule 4). Use getByRole/getByLabel/getByText/getByTestId, or move the selector into the adapter.'
      : undefined,
  };
}

/**
 * Hardcoded http(s):// literals belong in an adapter's endpoints.ts, not in test files
 * (AGENTS.md; lint rule no-restricted-syntax, scoped in eslint.config.mjs to tests/**\/*.ts).
 */
export function checkNoHardcodedUrl(filePath, content) {
  if (!isTestFile(filePath)) {
    return { rule: 'no-hardcoded-url', violated: false };
  }
  const violated = /https?:\/\//.test(stripCommentsForScanning(content));
  return {
    rule: 'no-hardcoded-url',
    violated,
    message: violated
      ? "Hardcoded http(s):// URLs are forbidden in test files — put them in the adapter's endpoints.ts (AGENTS.md; lint rule no-restricted-syntax)."
      : undefined,
  };
}

/**
 * `any` in any of its common forms — `: any`, `Array<any>`, `Foo | any`, `x as any`, and
 * `any` as a non-first generic argument (`Record<string, any>`, `<T = any>`).
 */
export function checkNoExplicitAny(_filePath, content) {
  const violated = /[:<|,=]\s*any\b|\bas\s+any\b/.test(stripCommentsForScanning(content));
  return {
    rule: 'no-explicit-any',
    violated,
    message: violated
      ? '`any` is forbidden — use `unknown` and narrow (AGENTS.md; lint rule @typescript-eslint/no-explicit-any).'
      : undefined,
  };
}

// Known async Playwright action methods this heuristic watches for. Deliberately a fixed,
// small list, not a type-aware analysis (that is `@typescript-eslint/no-floating-promises`'s
// job at lint time, which needs real type information this script does not have). A call to
// a method NOT in this list — or a call chained in a way this line-based heuristic can't
// see — is a known blind spot. Record any such case in Open Questions rather than growing
// this into a parser (see the plan's Key Technical Decision on AST vs. plain matching).
const ASYNC_METHOD_NAMES = [
  'click',
  'dblclick',
  'fill',
  'type',
  'press',
  'check',
  'uncheck',
  'hover',
  'tap',
  'focus',
  'blur',
  'selectOption',
  'setInputFiles',
  'dragTo',
  'goto',
  'waitForLoadState',
  'waitForURL',
  'waitForSelector',
  'waitForTimeout',
  'reload',
];
const FLOATING_CALL_RE = new RegExp(`\\.(?:${ASYNC_METHOD_NAMES.join('|')})\\s*\\(`);

/**
 * Line-based heuristic: flags a call to a known Playwright action method where the enclosing
 * statement has no `await`. Tracks whether the *current statement* — not just the current
 * line — started with `await`, since Prettier commonly wraps a chained call like
 * `await this.page.getByLabel(...).fill(...)` across several lines; a purely per-line check
 * would misread every continuation line as unawaited. A line is treated as continuing the
 * previous statement unless the previous line ended with `;`, `{`, or `}`. Every real call in
 * this codebase is awaited (rule 7), so this should read zero violations against genuine
 * passing code, single-line or multi-line — see the module test suite.
 */
export function checkNoFloatingPlaywrightCall(_filePath, content) {
  let awaited = false;
  let continuing = false;
  let offender = null;

  for (const line of stripCommentsForScanning(content).split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('*')) continue;

    if (!continuing) {
      awaited = trimmed.startsWith('await');
    }

    if (!offender && FLOATING_CALL_RE.test(trimmed) && !awaited && !trimmed.includes('await ')) {
      offender = trimmed;
    }

    continuing = !/[;{}]$/.test(trimmed);
  }

  return {
    rule: 'no-floating-playwright-call',
    violated: Boolean(offender),
    message: offender
      ? `Playwright call not awaited — every async Playwright call must be awaited (AGENTS.md rule 7; lint rule @typescript-eslint/no-floating-promises): "${offender}"`
      : undefined,
  };
}

// Matches this repo's actual page-object naming convention (every current page object —
// TubiHomePage, TubiLiveTvPage, TubiPlayerPage, JuiceShopHomePage, JuiceShopLoginPage,
// ExpandTestingLoginPage — ends in "Page"). A page object class that doesn't follow this
// convention wouldn't be caught; broadening to any `new Capitalized(page)` would risk flagging
// unrelated classes, so this stays scoped to the convention this codebase actually uses today.
const PAGE_OBJECT_NEW_RE = /\bnew\s+[A-Z]\w*Page\s*\(/;

/**
 * Page objects must come from `shared/fixtures/index.ts` (AGENTS.md rule 3), never
 * instantiated directly in a test file. No lint rule covers this today — this is its first
 * mechanical enforcement of any kind. Exempts fixture-definition files themselves (where the
 * instantiation IS the sanctioned one) and adapters composing another adapter.
 */
export function checkNoPageObjectInstantiationBypass(filePath, content) {
  if (isFixtureDefinitionFile(filePath) || isAdapterFile(filePath)) {
    return { rule: 'no-page-object-instantiation-bypass', violated: false };
  }
  const violated = PAGE_OBJECT_NEW_RE.test(stripCommentsForScanning(content));
  return {
    rule: 'no-page-object-instantiation-bypass',
    violated,
    message: violated
      ? 'Page objects must come from shared/fixtures/index.ts, not be instantiated directly in a test file (AGENTS.md rule 3 — no lint rule exists for this yet).'
      : undefined,
  };
}

const ALL_CHECKS = [
  checkNoWaitForTimeout,
  checkNoRawLocatorOutsideAdapter,
  checkNoHardcodedUrl,
  checkNoExplicitAny,
  checkNoFloatingPlaywrightCall,
  checkNoPageObjectInstantiationBypass,
];

/** Runs every check against one file and returns all six results (violated or not). */
export function runChecks(filePath, content) {
  // Docs, JSON, and other non-source writes aren't in scope for any of these six patterns —
  // checking empty content reuses each function's own "no match" path instead of duplicating
  // the violated:false / rule-name shape here.
  if (!isCheckableSourceFile(filePath)) {
    return ALL_CHECKS.map((check) => check(filePath, ''));
  }
  return ALL_CHECKS.map((check) => check(filePath, content));
}

/** Runs every check and returns only the violations. */
export function getViolations(filePath, content) {
  return runChecks(filePath, content).filter((result) => result.violated);
}

// --- CLI entry point (R6) ---------------------------------------------------------------

const TARGET_TOOLS = new Set(['Write', 'Edit', 'MultiEdit']);

/**
 * Extracts (filePath, content) from a Claude Code PreToolUse payload. `Write` carries the
 * full file body in `tool_input.content`. `Edit` does not — its real shape is
 * `file_path`/`old_string`/`new_string` (a targeted replacement, not the full file), so only
 * `new_string` is available to check; a violation introduced by the surrounding unchanged
 * file content is invisible to this script either way, wired live or not. MultiEdit's exact
 * payload shape is one of this plan's documented unconfirmed contract details (see Risks &
 * Dependencies) — best-effort here: concatenate every edit's `new_string`. Returns null if
 * nothing checkable is present.
 */
function extractFileAndContent(payload) {
  if (!payload || !TARGET_TOOLS.has(payload.tool_name)) return null;
  const input = payload.tool_input;
  if (!input || typeof input.file_path !== 'string') return null;
  if (typeof input.content === 'string') {
    return { filePath: input.file_path, content: input.content };
  }
  if (typeof input.new_string === 'string') {
    return { filePath: input.file_path, content: input.new_string };
  }
  if (Array.isArray(input.edits)) {
    const content = input.edits
      .map((edit) => (typeof edit?.new_string === 'string' ? edit.new_string : ''))
      .join('\n');
    return { filePath: input.file_path, content };
  }
  return null;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function main() {
  let raw;
  try {
    raw = await readStdin();
  } catch {
    process.exit(0); // A stdin stream error passes through as allow, never a hang or a crash.
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0); // Malformed input passes through as allow, never a crash.
  }

  const extracted = extractFileAndContent(payload);
  if (!extracted) {
    process.exit(0); // Non-target tool, or nothing checkable — allow.
  }

  const violations = getViolations(extracted.filePath, extracted.content);
  if (violations.length === 0) {
    process.exit(0);
  }

  const systemMessage = violations.map((v) => `[${v.rule}] ${v.message}`).join('\n');
  try {
    process.stderr.write(
      `${JSON.stringify({
        hookSpecificOutput: { permissionDecision: 'deny' },
        systemMessage,
      })}\n`,
    );
  } catch {
    // A failed write must not be mistaken for a clean allow — still block, just without the
    // explanatory message Claude Code would otherwise have surfaced.
  }
  process.exit(2);
}

// Only run the CLI when invoked directly (`node scripts/enforce-agent-rules.mjs`), not when
// imported by the test suite or the demo harness.
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
