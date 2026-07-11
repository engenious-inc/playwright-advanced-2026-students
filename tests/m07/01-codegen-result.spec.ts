/* eslint-disable playwright/expect-expect, playwright/valid-title, no-restricted-syntax --
 * These lint rules are DISABLED ON PURPOSE for this file.
 *
 * Codegen produces tests with literally `test('test', ...)` as the name, zero
 * assertions, and a hardcoded `page.goto('https://...')` URL — all lint
 * violations in this project. The M07 lecture uses this file to teach students
 * what codegen *actually* produces. If we silently fixed the lint violations the
 * lesson would be obscured.
 *
 * The disable here is the teaching artifact. Module 9 (instruction files +
 * guardrails) reinforces that you do NOT disable lint to make AI-generated
 * code green — you fix the code. The exception in this single file is for
 * pedagogy only.
 */
/**
 * M07 lecture 7.B — Inspector codegen on Tubi
 *
 * THIS FILE IS INTENTIONALLY BRITTLE.
 * It's the unedited output `npx playwright codegen tubitv.com` produces when
 * you walk a flow once: click the Tubi logo, click "Movies" in the menubar,
 * click the first content tile. Codegen recorded what was on screen at the
 * moment of recording. It has no notion of Page Object Model, no fixtures,
 * no convention awareness. The selectors will rot.
 *
 * DO NOT use this as a model for writing tests. It's a teaching artifact.
 * Lecture 7.B walks through exactly what's wrong with each line:
 *   - `test('test', ...)` — no descriptive name
 *   - `import { test, expect } from '@playwright/test'` — bypasses fixtures
 *   - Inline selectors instead of going through TubiHomePage adapter
 *   - `.first()` everywhere — fragile across content rotation
 *   - No assertions — codegen records actions but not "what should be true"
 *
 * Compare against ./02-claude-mcp-result.spec.ts and ./03-test-agents-result.spec.ts
 * for the same flow expressed through better methods.
 */

import { test } from '@playwright/test';
import { skipInHeadless, skipOnMobile } from '../../shared/test-guards.js';

test('test', async ({ page }) => {
  skipInHeadless('Codegen teaching artifact — content tiles need headed mode');
  skipOnMobile('Codegen walkthrough uses desktop menubar');
  await page.goto('https://tubitv.com/');
  await page.getByRole('link', { name: 'Tubi logo' }).first().click();
  await page.getByRole('menuitem', { name: 'Movies' }).click();
  await page.locator('div.web-content-tile').first().click();
});
