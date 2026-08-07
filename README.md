# Playwright Advanced 2026

> _From Production Failures to Self-Healing Agents._
> The companion repo for Greg Goldshteyn's _Playwright Advanced 2026_ course (Engenious University).

This repo holds the per-module code for a **20-module** course on production-grade Playwright in 2026 — agentic test workflows, modern network capabilities, no-DOM surfaces, and the tiered AI testing architecture that survives real production. **16 core modules** plus **4 advanced extensions** (M17 Performance, M18 Synthetic monitoring, M19 Component testing, M20 Testing AI & LLM features).

## Quick start

**Cloud (no local setup):**

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/engenious-inc/playwright-advanced-2026-students)

**Local:**

```bash
git clone https://github.com/engenious-inc/playwright-advanced-2026-students
cd playwright-advanced-2026-students
nvm use            # pins Node 22
npm install
npx playwright install --with-deps
npm run agents:init  # writes the Test Agents (planner/generator/healer) into .claude/agents/
npm test           # default suite; excludes @healer-demo; Juice Shop specs skip until juice-shop:up
```

Then run the wow moment:

```bash
npm run brag       # ~2 min agentic loop demo on Tubi
```

## Running tests

`npm test` runs the default suite and excludes specs tagged `@healer-demo` (the M09 intentional-fail healer demo). Juice Shop–dependent tests still skip until `npm run juice-shop:up`.

To run the healer demo explicitly:

```bash
npx playwright test tests/m09/demo-banner.spec.ts
```

### Module and targeted commands

| Script                                      | What it runs                                                            |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `npm run test:m11`                          | `tests/m11` — tiered AI (deterministic + a11y + vision)                 |
| `npm run test:m12`                          | `tests/m12` — video / media                                             |
| `npm run test:m13`                          | `tests/m13` — visual and temporal                                       |
| `npm run test:m14`                          | `tests/m14` (Juice Shop project)                                        |
| `npm run test:m15`                          | `tests/m15` + auth setup (setup + Juice Shop projects)                  |
| `npm run test:mcp`                          | MCP server unit tests (`mcp-server/test/`)                              |
| `npm run test:headed`                       | Full suite, headed browser                                              |
| `npm run test:ui`                           | Playwright UI mode                                                      |
| `npm run test:debug`                        | Playwright debug mode                                                   |
| `npm run verify`                            | typecheck + lint + format check (CI gate, no browser)                   |
| `npm run brag`                              | Agentic loop demo on Tubi (~2 min)                                      |
| `npm run juice-shop:up` / `juice-shop:down` | Start / stop OWASP Juice Shop on `localhost:3000`                       |
| `npm run agents:init`                       | Write Test Agents (planner / generator / healer) into `.claude/agents/` |
| `npm run mcp-server:dev`                    | Run the custom MCP server locally                                       |
| `npm run report` / `trace`                  | Open HTML report or trace viewer                                        |
| `npm run codegen`                           | Launch Playwright codegen                                               |

**Live-site dry run (M07 / M12 live Tubi specs):** headed Chromium, one worker — `01-codegen-result.spec.ts` is intentionally brittle and excluded from must-pass.

```bash
npx playwright test tests/m07 tests/m12 --headed --project=chromium --workers=1
```

## Course structure

| Track                   | Modules   | What it teaches                                                                                                   |
| ----------------------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| **Foundations**         | M01 – M03 | The 2026 stack, project setup, locator strategies                                                                 |
| **Network**             | M04 – M06 | `page.route`, HAR replay, WebSocket, report-gen, contract testing                                                 |
| **Agentic**             | M07 – M10 | Four ways to generate code (+ cost model), Test Agents, instruction files, custom MCP server                      |
| **Beyond the DOM**      | M11 – M13 | Tiered AI (deterministic + a11y + vision), video/media, visual & temporal                                         |
| **Architecture & Ops**  | M14 – M16 | Test data + fixtures at depth, auth at scale, CI/CD economics + capstone                                          |
| **Advanced extensions** | M17 – M20 | Performance testing (Lighthouse + Web Vitals), synthetic monitoring, component testing, testing AI & LLM features |

### Release & viewing order

The table above is the **repo's internal organization** — modules keyed by thematic code `M01`–`M20`. **Videos ship and are watched in a different, chronological order**, because the release leads with the agentic modules rather than setup. Learners see a clean, sequential **Module 0 → 20** release order, and the internal `M##` codes **never appear on screen or in video titles**. See [`docs/module-branches.md`](./docs/module-branches.md).

The `main` branch is the converged "best-practice" destination state — everything taught across the course lands here. Per-module lab branches (e.g. `m07-three-ways`, `m11-tiered-model`) are published so students can `git checkout` the name a lecture references; they currently point at `main` until each module's recording sprint lands module-specific artifacts. See [`docs/module-branches.md`](./docs/module-branches.md).

## Project conventions

- **TypeScript strict mode.** No `any`, no implicit anything.
- **POM mandatory.** All site interaction through `BasePage` subclasses in `shared/anchor-helpers/`.
- **Anchor adapters.** Modules reference the adapter, never the site directly. Sites can be swapped by writing new adapters; modules don't change.
- **Web-first assertions.** `expect(locator).toBeVisible()` over `expect(await locator.isVisible()).toBe(true)`. No `waitForTimeout`.
- **Lint blocks merge.** `eslint-plugin-playwright` catches AI-generated anti-patterns.

See [`AGENTS.md`](./AGENTS.md) for the full rules. The same content is mirrored to [`CLAUDE.md`](./CLAUDE.md) so Claude Code — the primary AI client used throughout the course — reads it on every session.

## Anchor sites

| Slot                 | Site                                                 | Used in                                     |
| -------------------- | ---------------------------------------------------- | ------------------------------------------- |
| Primary + Video      | [Tubi](https://tubitv.com) (`tubitv.com`)            | M03–M05, M07–M09, M11–M13, parts of M15     |
| Controlled secondary | OWASP Juice Shop (Docker, `localhost:3000`)          | M06, M11 (intentional bugs), M16 capstone   |
| Edge-case detour     | [Expand Testing](https://practice.expandtesting.com) | M03 iframes / shadow-DOM, M15 auth variants |

To run modules that depend on Juice Shop:

```bash
npm run juice-shop:up    # starts juice shop on localhost:3000
npm test                 # tests now have access
npm run juice-shop:down  # stops it
```

## Tooling

- **Playwright 1.60+** with Test Agents (planner / generator / healer) — run `npm run agents:init` to write them into `.claude/agents/`
- **Custom MCP server** (`qa-workflow`, M10) — see [`mcp-server/README.md`](./mcp-server/README.md); run locally with `npm run mcp-server:dev`
- **eslint-plugin-playwright** for catching AI-generated anti-patterns at lint time
- **@axe-core/playwright** for accessibility audits (used in M13)
- **Husky** for pre-commit lint + typecheck
- **GitHub Actions CI** runs typecheck + lint + tests on every PR (single-job gate with browser caching; M16 16.A teaches the sharded + blob/`merge-reports` pattern for larger suites)
- **Devcontainer / Codespaces** ready

## License

MIT for the code, tests, and docs here — see [`LICENSE`](./LICENSE).

The movie poster artwork under `tests/m03/fixtures/posters/` is **not** covered:
it belongs to its respective copyright holders and is included only so the
Module 3 locator fixtures match the real Tubi layout. Replace those files before
publishing a fork. See [`NOTICE`](./NOTICE).
