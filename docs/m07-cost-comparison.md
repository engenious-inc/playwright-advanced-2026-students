# M07 — MCP vs CLI cost comparison (methodology + results)

Repo home: `docs/m07-cost-comparison.md`. This is the doc lecture **7.E** points to ("current figures are in the repo"). It exists so the cost numbers shown on camera are **reproducible and refreshable**, not asserted. The video teaches the _shape_ of the result; this file owns the _exact numbers_ and gets updated as models and Playwright change — that's the shelf-life contract from `two-layer-authoring-and-shelf-life.md`.

> **Status of the numbers below (updated 2026-09-24):** both arms are **measured in this repo** — MCP n=3
> (2026-09-24), CLI n=6 (2026-09-22), same model, same prompt, every run's test passing. **Result: a tie** — MCP
> median $0.93, CLI median $0.90 (1.03x). The July 2026 launch-baseline "~4x" does not reproduce on current
> versions; see "Why the gap closed" below. Two earlier corrections still apply: the model price was a generation
> out of date, and the step-4 cost formula is not valid arithmetic under prompt caching. Both are fixed in place.

---

## What we measured

The identical task from lecture 7.D/7.E, run two ways by the same agent (Claude Code), generating the same test:

> "Open Tubi, navigate to the Movies section, and verify at least 12 content tiles render. Use typed fixtures and the existing `TubiHomePage` adapter; follow `CLAUDE.md`."

- **Run A — MCP:** Claude Code drives the browser through the Playwright **MCP server** (stateful; streams accessibility snapshots into context each step). Output: `tests/m07/02-claude-mcp-result.spec.ts`.
- **Run B — CLI:** Claude Code drives Playwright through the **CLI** workflow (commands write artifacts to disk; the agent reads selectively). Output: `tests/m07/04-cli-result.spec.ts`.

Both runs must produce a **passing, convention-clean** test, or the comparison is invalid (a cheap run that fails is not cheaper). Confirm both green before recording the numbers.

## How tokens & cost are counted

1. **Token source = the model API, not an estimate.** Run headless and read the run's own JSON:
   `claude -p "<prompt>" --output-format json`. This replaces the manual client/dashboard read — same data,
   exact and scriptable. The figures it reports are **list price** (`modelUsage.<model>.costBasis == "list"`).

   **Token definition — state it, because "~114K tokens" is meaningless under prompt caching without it:**

   ```
   TOKENS = input_tokens + cache_creation_input_tokens + cache_read_input_tokens + output_tokens
   ```

   Note what this means for a multi-turn agent session: the context is re-read from cache on _every_ turn, so
   this sum counts the context roughly once per turn. It is a cumulative billing measure, **not** a context
   size. A ~48-turn session over a ~50K context lands in the millions. Report the input/output split beside
   the total.

2. **One task = one fresh session.** Start each run in a clean Claude Code session so no prior context inflates the count. Same prompt, same repo state (same `CLAUDE.md`, same adapter with `browseMenuItem` already present so neither run pays for the 7.D adapter fix).
3. **Count the whole task,** start of prompt to committed passing test, including retries. That's the real-world number.
4. **Cost = the `total_cost_usd` the run reports.** Do **not** compute `tokens × published price`: under prompt
   caching that is wrong by a large factor, because cache _writes_ bill at 1.25x/2x base input and cache _reads_
   at 0.1x. Measured here: a probe using 85,689 tokens cost $0.067 while a no-op using 54,603 tokens cost
   $0.146 — 1.6x the tokens for 2.2x less money. Record the price snapshot date and the pinned model.
5. **Run it 3×, report the median.** Agent runs vary; a single sample is noise. Note the spread.

## Pinned environment (fill in at record time)

| Field                           | Value                                                       |
| ------------------------------- | ----------------------------------------------------------- |
| Date measured                   | CLI 2026-09-22 · MCP 2026-09-24                             |
| Playwright version              | 1.62.1                                                      |
| Playwright MCP server version   | @playwright/mcp 0.0.82                                      |
| Playwright CLI version          | @playwright/cli 0.1.21 (pinned devDependency)               |
| Agent client                    | Claude Code 2.1.280 (Node v22.22.2)                         |
| Model                           | `claude-sonnet-5`                                           |
| Model price (in / out per Mtok) | $2.00 / $10.00 (cache write 5m $2.50, 1h $4.00; read $0.20) |
| Price snapshot date             | 2026-09-22                                                  |
| Cost basis                      | list (`modelUsage.claude-sonnet-5.costBasis == "list"`)     |
| Runs                            | CLI 6, MCP 3 (median reported)                              |

## Results

| Method    | Tokens (median)                      | Cost (median)                      | State model                                | Test output                    |
| --------- | ------------------------------------ | ---------------------------------- | ------------------------------------------ | ------------------------------ |
| MCP       | **2,215,242** _(measured here, n=3)_ | **$0.9319** _(measured here, n=3)_ | Stateful session; snapshots saved to files | `02-claude-mcp-result.spec.ts` |
| CLI       | **2,597,239** _(measured here, n=6)_ | **$0.9035** _(measured here, n=6)_ | Artifacts on disk; agent reads selectively | `04-cli-result.spec.ts`        |
| **Ratio** | **MCP:CLI 0.85x**                    | **MCP:CLI 1.03x — a tie**          | —                                          | —                              |

Spread: CLI (6 runs) tokens **1,120,801 – 3,080,806**, cost **$0.5372 – $1.1556**; MCP (3 runs) tokens
**1,847,806 – 3,411,908**, cost **$0.7822 – $1.2743**. The spreads overlap almost entirely.

**Input/output split (measured, CLI arm):** output tokens were 12,650–23,158 against 1.1M–3.1M input+cache —
output is **~0.5%** of the total. The doc's former _assumption_ of input-dominated usage is now **verified**.

> **Why the measured CLI number is ~100x the ~27K baseline. This is a different measurement basis, not drift —
> do not "fix" it by adjusting a number.**
> Three separate effects, all documented rather than reconciled away:
>
> 1. **Definition.** `TOKENS` sums `cache_read_input_tokens`, and an agent session re-reads its context every
>    turn. These runs took 28–55 turns. The figure is cumulative billed units, not a context size. The ~27K
>    baseline is not a like-for-like quantity.
> 2. **Session floor.** A **no-op** prompt ("reply OK") in this repo costs **54,603 tokens / $0.1458** before
>    any work happens — system prompt, tool definitions and `CLAUDE.md`. The ~27K/~$0.08 CLI baseline is below
>    the floor of an empty session in Claude Code 2.1.280, so it cannot be reproduced here under any reading.
> 3. **Harness, not interface.** Much of the total is agent-harness overhead (repo exploration, reading the
>    adapter, running the suite, self-correction) that is identical whichever browser interface is used. It
>    inflates both arms and compresses the ratio between them.
>
> The consequence for the lecture: **the ~114K / ~27K absolutes are not reproducible on this basis and must not
> be presented as if they were.** They appear to describe a context-size quantity; `TOKENS` above is cumulative
> billed units. The two are not interconvertible, so no correction factor recovers one from the other — only a
> fresh measurement on a stated basis does. The ratio is the claim that actually matters — and measured on one basis, it is 1.03x.

### The scale projection 7.E cites

```
per-test delta            = MCP_cost − CLI_cost
monthly suite regen cost  = per_test_delta × suite_size × regens_per_month
```

**Measured delta: $0.9319 − $0.9035 = ~$0.03 per test**, inside the run-to-run spread — so on this stack the
interface choice does not move the bill. What does: the absolute per-test cost. At ~$0.90 per generated test, a
2,000-test monthly regeneration is ~$1,800/month on **either** interface. That is the shape of the M16 argument:
the lever is the agent (prompt quality, wandering, retries), not MCP vs CLI.

This is the hook into **M16 (CI/CD economics)**, where it's expanded with sharding and CI-runner cost.

## Why the gap closed (the teachable cause, not just the number)

The launch-era case for the CLI was that MCP streamed the page's accessibility tree back into the model's context
on every observation step, while the CLI wrote it to disk for the agent to read selectively. **On current
versions, both interfaces do the disk version.** Measured in the 2026-09-24 MCP runs (`@playwright/mcp` 0.0.82):
every MCP tool result was under 1.2K characters — `browser_navigate` and `browser_snapshot` return a link to a
saved `.playwright-mcp/page-*.yml` file or a small targeted fragment, never the full ~26–31 KB tree. The
agents in those runs never read the saved snapshot files at all.

With the per-step payload gone from both arms, the total is dominated by the agent harness — repo exploration,
file reads, test runs, self-correction — which is identical whichever browser interface is used. That is why the
two arms tie and why both run to millions of cumulative tokens.

> **Verified, no longer an assumption:** usage is **overwhelmingly input-dominated**. Across the 6 measured CLI
> runs, output was 12,650–23,158 tokens against 1.1M–3.1M input+cache — **~0.5%** of the total. The MCP runs
> match (output 13,735–17,527).
>
> **Measured payload size.** A live `playwright-cli` session against Tubi wrote each accessibility snapshot to
> disk at **26,517 B / 529 lines (~6.6K tokens)** and **31,762 B / 667 lines (~7.9K tokens)** — the payload
> that neither interface now streams into context by default. Caveat for anyone reproducing: a bare
> `playwright-cli snapshot` prints the tree to stdout, which would put it back in context.

## When the number does NOT decide it (keep this honest)

On this task, price did not separate the interfaces, so choose on workflow. The deliverable of 7.E is the
_judgment_, and the rubric is:

- Reasoning about live state → **MCP** (a live session to explore and recover in)
- Executing a known plan → **CLI** (commands and files, simple to script, log and review)
- Autonomous goal → suite → **Test Agents** (which run over Playwright's test MCP server,
  `playwright run-test-mcp-server` — so the same harness-dominated cost math applies underneath)

## How to refresh (run this when Playwright or the model changes)

1. Bump the pinned versions in this repo; ensure both result specs still pass.
2. Re-run Runs A and B, 3× each, fresh sessions. Pull token usage from the client/provider.
3. Update the Results table (median + spread), the price snapshot, and the worked projection.
4. Re-record **7.E Scenes 4–5 only** (the volatile segment, tagged `7.A`/`7.E ⏱`), bump the on-screen date badge, and update `docs/recording-shelf-life.md`.
5. If the _ratio_ changed materially (not just the absolute numbers), revisit the 7.E narration — the "~4×" claim is spoken, so a big shift needs a re-record of that line, not just the slide.

## Reproduce locally (commands)

```bash
nvm use                      # pin Node 22
npm install
npx playwright install --with-deps
npm run juice-shop:up        # only if a run needs the controlled anchor; Tubi is the target here

# Both arms run headless so the usage JSON is captured exactly. Invoke the BINARY (a `claude` shell
# function may cd elsewhere and silently measure the wrong repo).

# Run A — MCP: only the Playwright MCP server; CLI denied so the arms are exclusive.
claude -p "<task prompt>" --model claude-sonnet-5 --output-format json \
  --strict-mcp-config --mcp-config '{"mcpServers":{"playwright":{"command":"npx","args":["@playwright/mcp@latest"]}}}' \
  --allowedTools "mcp__playwright" Read Write Edit Glob Grep "Bash(npx playwright test *)" \
  --disallowedTools "Bash(git *)" "Bash(npx playwright-cli *)" > runA.json

# Run B — CLI: zero MCP servers, which is what makes it the CLI arm.
claude -p "<task prompt>" --model claude-sonnet-5 --output-format json \
  --strict-mcp-config --mcp-config '{"mcpServers":{}}' \
  --allowedTools Read Write Edit Glob Grep "Bash(npx playwright-cli *)" "Bash(npx playwright test *)" \
  --disallowedTools "Bash(git *)" > runB.json

# Then confirm the produced spec is green (headed — the tile test skips in headless):
npx playwright test tests/m07/04-cli-result.spec.ts --headed --project=chromium --workers=1
```

> **Three traps that will silently invalidate a re-measurement — all hit during the 2026-09-22 run:**
>
> 1. **The target spec already exists and passes.** A run pointed at it generates nothing — one discarded run
>    made 40 turns and 3,165,850 tokens with _zero_ Write/Edit calls. Remove `02`/`03`/`04` before each run
>    (and restore after) so the task is genuinely generation. `03` must go too: it is a near-complete answer.
> 2. **The agent will recover the answer from git.** Another discarded run produced a **byte-identical** spec
>    via `git show HEAD:tests/m07/02-…`. Deny `Bash(git *)` in both arms.
> 3. **`permission_denials: []` may prove nothing.** If `~/.claude/settings.json` sets
>    `permissions.defaultMode: "auto"`, un-allowlisted tools run anyway and the denial list stays empty.
>    Enforce arms structurally (`--strict-mcp-config`) plus explicit `--disallowedTools`, and check the
>    transcript for which tools were actually used.
>
> Residual, unfixable without changing the repo state: `specs/m07-tubi-browse.md` and
> `docs/modules/.../7D-claude-code-mcp-live.md` still describe the expected test. Equal for both arms, so it
> depresses both absolute figures and leaves the ratio as the defensible output.
