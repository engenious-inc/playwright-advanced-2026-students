# M07 — MCP vs CLI cost comparison (methodology + results)

Repo home: `docs/m07-cost-comparison.md`. This is the doc lecture **7.E** points to ("current figures are in the repo"). It exists so the cost numbers shown on camera are **reproducible and refreshable**, not asserted. The video teaches the _shape_ of the result; this file owns the _exact numbers_ and gets updated as models and Playwright change.

> **Status of the numbers below:** the headline figures (~114K vs ~27K tokens) are launch-baseline values from course research (July 2026). Before recording 7.E, **run the measurement in this repo** and replace the "Measured here" column with your own values. Numbers drift; the method doesn't.

---

## What we measured

The identical task from lecture 7.D/7.E, run two ways by the same agent (Claude Code), generating the same test:

> "Open Tubi, navigate to the Movies section, and verify at least 12 content tiles render. Use typed fixtures and the existing `TubiHomePage` adapter; follow `CLAUDE.md`."

- **Run A — MCP:** Claude Code drives the browser through the Playwright **MCP server** (stateful; streams accessibility snapshots into context each step). Output: `tests/m07/02-claude-mcp-result.spec.ts`.
- **Run B — CLI:** Claude Code drives Playwright through the **CLI** workflow (commands write artifacts to disk; the agent reads selectively). Output: `tests/m07/04-cli-result.spec.ts`.

Both runs must produce a **passing, convention-clean** test, or the comparison is invalid (a cheap run that fails is not cheaper). Confirm both green before recording the numbers.

## How tokens & cost are counted

1. **Token source = the model API, not an estimate.** Read total input+output tokens for the whole task from Claude Code's own usage report (it prints per-session token usage) and/or the provider dashboard for the session. Don't tokenize the transcript by hand — tool-call payloads (the snapshots) are where MCP's cost actually lives, and a manual count will miss them.
2. **One task = one fresh session.** Start each run in a clean Claude Code session so no prior context inflates the count. Same prompt, same repo state (same `CLAUDE.md`, same adapter with `browseMenuItem` already present so neither run pays for the 7.D adapter fix).
3. **Count the whole task,** start of prompt to committed passing test, including retries. That's the real-world number.
4. **Cost = tokens × the model's published per-token price** at the pinned model version. Show input and output separately if the model prices them differently, then total. Record the price snapshot date.
5. **Run it 3×, report the median.** Agent runs vary; a single sample is noise. Note the spread.

## Pinned environment (fill in at record time)

| Field                           | Value                           |
| ------------------------------- | ------------------------------- |
| Date measured                   | _<YYYY-MM-DD>_                  |
| Playwright version              | _<e.g. 1.60.x>_                 |
| Playwright MCP server version   | _<x.y.z>_                       |
| Playwright CLI version          | _<x.y.z>_                       |
| Agent client                    | Claude Code _<version>_         |
| Model                           | _<e.g. claude-sonnet model id>_ |
| Model price (in / out per Mtok) | _<$ / $>_                       |
| Price snapshot date             | _<YYYY-MM-DD>_                  |
| Runs                            | 3 (median reported)             |

## Results

| Method    | Tokens (median)                       | Cost (median)           | State model                                          | Test output                    |
| --------- | ------------------------------------- | ----------------------- | ---------------------------------------------------- | ------------------------------ |
| MCP       | **~114K** _(measured here: \_\_\_\_)_ | **~$0.34** _(\_\_\_\_)_ | Stateful — full a11y snapshot into context each step | `02-claude-mcp-result.spec.ts` |
| CLI       | **~27K** _(measured here: \_\_\_\_)_  | **~$0.08** _(\_\_\_\_)_ | Artifacts on disk; agent reads selectively           | `04-cli-result.spec.ts`        |
| **Ratio** | **~4× (MCP : CLI)**                   | **~4×**                 | —                                                    | comparable quality             |

Spread across the 3 runs: _<min–max per method>_.

### The scale projection 7.E cites

The per-test number is pocket change; the lecture's point is what it becomes at scale. Worked example to show on screen (recompute from your measured median):

```
per-test delta            = MCP_cost − CLI_cost            (e.g. $0.34 − $0.08 = $0.26)
monthly suite regen cost  = per_test_delta × suite_size × regens_per_month
example                   = $0.26 × 2,000 tests × 1 regen  ≈ $520 / month, MCP over CLI
```

This is the hook into **M16 (CI/CD economics)**, where it's expanded with sharding and CI-runner cost.

## Why the gap exists (the teachable cause, not just the number)

MCP streams the page's accessibility tree (and sometimes screenshots) back into the model's context on **every** observation step — that payload is the dominant token cost. The CLI writes those artifacts to disk and lets the agent read **only the slice it needs**, so the model's context carries far less per step. Microsoft has indicated it expects the CLI to become the default interface for coding agents for exactly this reason.

> **Assumption:** headline cost figures assume **input-dominated** usage (tool payloads and snapshots billed as input tokens). If your runs are output-heavy, recompute from the provider's input/output split.

## When the number does NOT decide it (keep this honest)

Cheaper ≠ better. The cost case is for **pre-planned execution**. If the agent must **reason about live page state** — explore an unfamiliar flow, recover mid-task — MCP's statefulness earns its tokens. The deliverable of 7.E is the _judgment_, and the rubric is:

- Reasoning about live state → **MCP**
- Executing a known plan → **CLI**
- Autonomous goal → suite → **Test Agents** (which themselves run over MCP or CLI — so this same cost math applies underneath)

## How to refresh (run this when Playwright or the model changes)

1. Bump the pinned versions in this repo; ensure both result specs still pass.
2. Re-run Runs A and B, 3× each, fresh sessions. Pull token usage from the client/provider.
3. Update the Results table (median + spread), the price snapshot, and the worked projection.
4. Re-record **7.E Scenes 4–5 only** (the volatile segment, tagged `7.A`/`7.E ⏱`) and bump the on-screen date badge.
5. If the _ratio_ changed materially (not just the absolute numbers), revisit the 7.E narration — the "~4×" claim is spoken, so a big shift needs a re-record of that line, not just the slide.

## Reproduce locally (commands)

```bash
nvm use                      # pin Node 22
npm install
npx playwright install --with-deps
npm run juice-shop:up        # only if a run needs the controlled anchor; Tubi is the target here

# Run A — MCP: start a fresh Claude Code session at repo root (.mcp.json registers the Playwright MCP server),
#   paste the task prompt, let it produce tests/m07/02-claude-mcp-result.spec.ts, confirm green:
npx playwright test tests/m07/02-claude-mcp-result.spec.ts

# Run B — CLI: fresh Claude Code session constrained to the CLI workflow,
#   produce tests/m07/04-cli-result.spec.ts, confirm green:
npx playwright test tests/m07/04-cli-result.spec.ts

# Record total token usage for each session from Claude Code's usage report / provider dashboard.
```

> Note: token/cost capture is a manual read from the agent client + provider for now — there's no committed script that bills an agent session end-to-end. If you want this fully reproducible, a small `scripts/measure-agent-cost.mjs` that wraps each run and logs usage would be a good companion-repo addition (candidate Tier-3 wow feature).
