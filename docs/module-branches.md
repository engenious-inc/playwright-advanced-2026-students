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
| `m10-build-your-own-mcp-server` | M10 — Custom MCP (SQLite backend) | **Diverged** — ported lab content (`3b4c66f`); in-memory fixtures on `main`                            |
| `m11-tiered-model`              | M11 — Tiered AI model             | **Diverged** — full tier-2/3 lab + `@anthropic-ai/sdk`; **tier-1 + offline demo now on `main`** (P2.1) |
| `m12-video-media`               | M12 — Video & media               | Placeholder → `main` (created 2026-08-06; the row had listed a branch that never existed)              |
| `m16-capstone`                  | M16 — Capstone homework           | **Diverged** — expanded messy-start suite (`tests/m16/messy-suite/`, `testIgnore`'d homework artifact) |
| `m17-performance-testing`       | M17 — Performance                 | Placeholder → `main`                                                                                   |
| `m18-synthetic-monitoring`      | M18 — Synthetic monitoring        | Placeholder → `main`                                                                                   |
| `m19-component-testing`         | M19 — Component testing           | Placeholder → `main`                                                                                   |
| `m20-testing-ai`                | M20 — Testing AI features         | **Diverged** — ported lab content (`d722000`); typed stubs on `main`                                   |

> **Audit + resync 2026-08-06.** Verified against `engenious-inc/playwright-advanced-2026-students`,
> then fixed. **All eleven branches are now level with `main`** (0 ahead of it in content, 0 behind).
>
> What the audit found, and what was done:
>
> - **All ten existing branches were 3 commits behind** — they predated the M03/M04 code sync and
>   the `NOTICE` license scoping, so the "kept fast-forwarded" claim above was false. The six pure
>   placeholders (`m07`, `m08`, `m09`, `m17`, `m18`, `m19`) were fast-forwarded.
> - **Four branches had diverged, not two.** `m10` and `m20` each carry a ported-lab commit this
>   table called "Placeholder" — fast-forwarding them would have destroyed it. All four (`m10`,
>   `m11`, `m16`, `m20`) were **merged**; each retains its lab commit and now also carries M03/M04.
> - **`m12-video-media` did not exist** despite being listed. Created at `main`.
> - **Ten modules have no branch at all** (M00–M06, M13–M15). That is fine and intended — but M00's
>   0B script claimed "every module has a branch named after it," which was false. Corrected before
>   0B was rendered.
>
> **Rule going forward:** placeholders may be fast-forwarded; the four diverged branches must be
> **merged**. Check `git rev-list --count origin/main..origin/<branch>` before touching any of them
> — a non-zero count means it carries work `main` does not have.

## M16 capstone tags

| Tag               | Purpose                               | Status                                                                                                                                   |
| ----------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `m16-messy-start` | Deliberately tangled Juice Shop suite | **Shipped 2026-08-06** — branch `m16-capstone`. All ten smells from the walkthrough, runnable: 5 passed / 14.9s against a live container |
| `m16-clean-end`   | Post-refactor destination             | **Shipped 2026-08-06** — branch `m16-capstone`. Same 5 tests, 3.5s, zero lint suppressions, running in the `juice-shop` CI project       |

Diff walkthrough: `docs/m16-refactor-walkthrough.md`.
