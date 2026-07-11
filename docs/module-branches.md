# Module lab branches

Per-module branches let students `git checkout` the name referenced in a lecture without hitting a missing ref. **`main` is the converged destination state** — lesson prose, adapters, and smoke tests live here.

Branches below are **placeholders kept fast-forwarded to `main`** until each module's recording sprint lands module-specific artifacts. Full lab history (demo captures, SQLite MCP, capstone messy suite, CT stack, etc.) will diverge on these branches as modules are recorded. Until then, refresh them to `main`'s tip whenever they fall behind so a `git checkout` gets current content.

> **Last fast-forwarded:** 2026-07-05 — all eleven branches aligned to `main` @ `ec89496` (SP5; they had drifted 9 commits behind at `f8fe70a`). `m11-tiered-model` has since **diverged** with its full tier lab (SP4) — the first branch to carry module-specific artifacts.
>
> **2026-07-07 (P2.1):** the **real tier-1 path** (`shared/tiered-ai/aria.ts` + `tier1-deterministic.ts` + the offline `tests/m11/tiered-locator.spec.ts` assertion) was cherry-picked **to `main`**, so the offline tiered demo now runs on `main` without the SDK. `main` keeps **tier-2/3 stubbed** (they pull `@anthropic-ai/sdk`, which stays out of `main`'s `package.json`); the `m11-tiered-model` branch remains the home of the full tier-2/3 implementation.

| Branch                          | Module                            | Status                                                                                                 |
| ------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `m07-three-ways`                | M07 — Four ways to generate code  | Placeholder → `main`                                                                                   |
| `m08-test-agents-e2e`           | M08 — Test Agents                 | Placeholder → `main` (M08 homework artifacts on `main`)                                                |
| `m09-instruction-files`         | M09 — Instruction files           | Placeholder → `main`                                                                                   |
| `m10-build-your-own-mcp-server` | M10 — Custom MCP (SQLite backend) | Placeholder → `main` (in-memory fixtures on `main`)                                                    |
| `m11-tiered-model`              | M11 — Tiered AI model             | **Diverged** — full tier-2/3 lab + `@anthropic-ai/sdk`; **tier-1 + offline demo now on `main`** (P2.1) |
| `m12-video-media`               | M12 — Video & media               | Placeholder → `main`                                                                                   |
| `m16-capstone`                  | M16 — Capstone homework           | **Diverged** — expanded messy-start suite (`tests/m16/messy-suite/`, `testIgnore`'d homework artifact) |
| `m17-performance-testing`       | M17 — Performance                 | Placeholder → `main`                                                                                   |
| `m18-synthetic-monitoring`      | M18 — Synthetic monitoring        | Placeholder → `main`                                                                                   |
| `m19-component-testing`         | M19 — Component testing           | Placeholder → `main`                                                                                   |
| `m20-testing-ai`                | M20 — Testing AI features         | Placeholder → `main` (typed stubs on `main`)                                                           |

## M16 capstone tags

| Tag               | Purpose                               | Status                                                                                                                                                 |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `m16-messy-start` | Deliberately tangled Juice Shop suite | Multi-file smell catalogue on branch `m16-capstone` (`tests/m16/messy-suite/`); repoint this tag there. Full ~30-test scale lands with the 16.G sprint |
| `m16-clean-end`   | Post-refactor destination             | Record-time — the verified clean suite is produced during the live 16.G refactor                                                                       |

Diff walkthrough: `docs/m16-refactor-walkthrough.md`.
