# M07 — Four ways to generate Playwright code (test artifacts)

These four files are the pre-staged outputs that M07's live demos produce.
They are committed so the lectures can reference them without typing on camera.

| File                                                               | Lecture                                        | Generation method                                                                                                                                                                                                                                      | Quality                                                                                                                                                                                      |
| ------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`01-codegen-result.spec.ts`](./01-codegen-result.spec.ts)         | 7.B Inspector codegen                          | `npx playwright codegen tubitv.com`                                                                                                                                                                                                                    | **Intentionally brittle** — no POM, inline selectors, no assertions. The "starting point not destination" example.                                                                           |
| [`02-claude-mcp-result.spec.ts`](./02-claude-mcp-result.spec.ts)   | 7.D Claude Code + MCP                          | Claude Code with the Playwright MCP server, following CLAUDE.md conventions. This file is an earlier run's final state; the 2026-09-24 session the video shows is in [`transcripts/`](../../docs/modules/M07-three-ways-to-generate-code/transcripts/) | **Production-grade** — uses adapter, fixtures, role-based locators. The adapter-fix moment: the agent rewrote `browseCategory`; review split out `browseMenuItem`.                           |
| [`04-cli-result.spec.ts`](./04-cli-result.spec.ts)                 | 7.E Playwright CLI (cost model)                | Same task as `02`, but Claude Code constrained to the CLI workflow (`npx playwright-cli` commands + on-disk artifacts, no MCP servers)                                                                                                                 | **Production-grade** — comparable to `02`, and measured at a comparable cost (median $0.90 vs MCP $0.93 — a tie).                                                                            |
| [`03-test-agents-result.spec.ts`](./03-test-agents-result.spec.ts) | 7.G Test Agents (planner → generator → healer) | 2026-09-24 run: planner produced [`specs/m07-tubi-browse.md`](../../specs/m07-tubi-browse.md), generator wrote three tests, healer repaired a disclosed, deliberate break                                                                              | **Production-grade** — generator added `browseMenuTrigger`, `browseCategoriesMenu` and `detailTitleHeading` to the adapter. The Browse-menu test keeps a real, unstaged flake (1 in 8 runs). |

> File numbering follows generation order across the recording (01 codegen → 02 MCP → 04 CLI → 03 Test Agents); the lecture column is the order students watch. The slugs are kept stable so branch links don't rot.

## Headlines per file (what to look at during recording)

**01:** The line `test('test', ...)` says everything. Codegen doesn't name your tests.

**02:** Compare lines for `browseMenuItem` vs. codegen's inline `getByRole('menuitem', { name: 'Movies' }).click()`. One survives Tubi's next menubar reshuffle. The other doesn't. (`browseCategory`, the method the agent first reached for, has since been deleted from `TubiHomePage` — it matched nothing on live Tubi and had no callers.)

**04:** Diff it against `02` — the tests are comparable, and so is the bill: median $0.90 (CLI, n=6) vs $0.93 (MCP, n=3). The launch-era ~27K vs ~114K tokens / ~4× did not reproduce. See [`docs/m07-cost-comparison.md`](../../docs/m07-cost-comparison.md).

**03:** Scenario 3's detail-page URL pattern `\/movies\/\d+` came from the planner itself, which explored live Tubi. The healer beat in 7.G is a disclosed, deliberate break (`contentTiles` → `div.content-tile`), healed back to `div.web-content-tile`.

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

Expectation: **02, 03, and 04 should pass reliably (run headed — the tile tests skip in headless), except 03's Browse-menu test, a known 1-in-8 flake kept on purpose; 01 will pass under stable Tubi states but is brittle by design.**
