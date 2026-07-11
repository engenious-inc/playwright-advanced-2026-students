# `qa-workflow` — the custom MCP server taught in M10

This directory contains the source for the QA-workflow MCP server that students build in **M10 — Build your own MCP server**. The server exposes four tools that let an MCP-aware client (Claude Code, Cursor, etc.) query a team's CI history.

| Tool                     | What it returns                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `get_failing_tests`      | Tests that failed in CI within a time window, with timestamps and failure messages |
| `get_flake_rate`         | Flake rate per test path pattern, computed over a configurable day window          |
| `get_recent_deploys`     | Most recent production deploys, with commit SHA + service list                     |
| `compare_aria_snapshots` | Diff between two saved ARIA snapshots                                              |

## Running the server

```bash
npm install
npm run mcp-server:dev      # stdio server (no watch — add `tsx watch` locally if you want reload)
```

The server speaks JSON-RPC over stdio. To register it with Claude Code, the `.mcp.json` at the repo root is already wired up — restart Claude Code and the tools become available.

Ask Claude something like:

> _"What's the flakiest test in our login suite this week? Are any of them related to a recent deploy?"_

Claude will discover the tools, call them in sequence, and correlate the results.

## Where the data comes from

On `main`, the handlers read from in-memory fixtures (`mcp-server/src/data/fixtures.ts`). The fixtures are realistic enough that the M10.D headline demo works end-to-end without external infrastructure.

A future branch may wire SQLite (`mcp-server/data/test-results.db`); `main` stays runnable for everyone.

## Module references

- **10.B** — minimum viable server (single file, hardcoded tool)
- **10.C** — designing tool descriptions for LLMs
- **10.D** — the four real tools (this directory's state)
- **10.E** — transports: stdio vs Streamable HTTP (SSE deprecated)
- **10.F** — when not to build a custom server (use the official Playwright MCP)
- **10.G** — where this breaks in production
