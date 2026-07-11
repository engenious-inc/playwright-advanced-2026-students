# M07 — Four ways to generate Playwright code (test artifacts)

These four files are the pre-staged outputs that M07's live demos produce.
They are committed so the lectures can reference them without typing on camera.

| File                                                               | Lecture                                        | Generation method                                                                                                                                        | Quality                                                                                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [`01-codegen-result.spec.ts`](./01-codegen-result.spec.ts)         | 7.B Inspector codegen                          | `npx playwright codegen tubitv.com`                                                                                                                      | **Intentionally brittle** — no POM, inline selectors, no assertions. The "starting point not destination" example.         |
| [`02-claude-mcp-result.spec.ts`](./02-claude-mcp-result.spec.ts)   | 7.D Claude Code + MCP                          | Claude Code drove the browser via Playwright MCP server, then wrote code following CLAUDE.md conventions                                                 | **Production-grade** — uses adapter, fixtures, role-based locators. Shows the adapter-fix moment (added `browseMenuItem`). |
| [`04-cli-result.spec.ts`](./04-cli-result.spec.ts)                 | 7.E Playwright CLI (cost model)                | Same task as `02`, but Claude Code constrained to the CLI workflow (commands + on-disk artifacts, no live MCP streaming)                                 | **Production-grade** — comparable to `02` but generated for ~¼ the tokens. The cost tiebreaker, not a quality one.         |
| [`03-test-agents-result.spec.ts`](./03-test-agents-result.spec.ts) | 7.G Test Agents (planner → generator → healer) | Planner produced [`specs/m07-tubi-browse.md`](../../specs/m07-tubi-browse.md), generator wrote tests, healer was REJECTED on a `waitForTimeout` band-aid | **Production-grade** — fix routed into adapter (`triggerLazyLoad`). Healer-band-aid lesson incarnated.                     |

> File numbering follows generation order across the recording (01 codegen → 02 MCP → 04 CLI → 03 Test Agents); the lecture column is the order students watch. The slugs are kept stable so branch links don't rot.

## Headlines per file (what to look at during recording)

**01:** The line `test('test', ...)` says everything. Codegen doesn't name your tests.

**02:** Compare lines for `browseMenuItem` vs. codegen's inline `getByRole('menuitem', { name: 'Movies' }).click()`. One survives Tubi's next menubar reshuffle. The other doesn't.

**04:** Diff it against `02` — the tests are comparable. The difference isn't on the page, it's on the bill: ~27K tokens vs ~114K. See [`docs/m07-cost-comparison.md`](../../docs/m07-cost-comparison.md).

**03:** The detail-page URL pattern in scenario 3 is `\/movies\/\d+` — that's the post-review version. The planner originally wrote `\/{some-slug}` because it didn't know Tubi uses numeric IDs. Greg corrected it on camera in 7.G.

## Running these

```bash
# All M07 tests
npx playwright test tests/m07/

# Specific demos
npx playwright test tests/m07/01-codegen-result.spec.ts
npx playwright test tests/m07/02-claude-mcp-result.spec.ts
npx playwright test tests/m07/04-cli-result.spec.ts
npx playwright test tests/m07/03-test-agents-result.spec.ts
```

Expectation: **02, 03, and 04 should pass reliably; 01 will pass under stable Tubi states but is brittle by design.**
