# `examples/m09/` — write-time hook demo payloads

Synthetic Claude Code `PreToolUse` payloads for `scripts/enforce-agent-rules.mjs`, recorded on
screen in M09's 9.D lecture. **Not imported by any test suite** — `scripts/enforce-agent-rules.test.mjs`
proves the check logic correct against its own inline and repo-sourced fixtures; these files exist
only to give the CLI entry point (`scripts/enforce-agent-rules.mjs`'s stdin/exit-code interface,
R6) something to run against on camera.

That is the opposite relationship of the two other kinds of thing under `examples/` (see
[`examples/README.md`](../README.md)): `examples/m08-manifest/` and `examples/m14/` are real source
dependencies real specs import; these payload files are consumed by nothing but a manual demo run.

Also distinct from the existing, adjacent
[`examples/where-this-breaks/m09-agents-drift/`](../where-this-breaks/m09-agents-drift/README.md) —
that example demonstrates instruction files and lint config drifting out of sync with each other
(a test that catches the doc-vs-lint mismatch). This one demonstrates a write-time gate that
intercepts a violation before either instructions or lint ever see it. Both are real; neither
replaces the other.

## Running the demo

```bash
for f in examples/m09/payloads/*.json; do
  echo "--- $f ---"
  node scripts/enforce-agent-rules.mjs < "$f"
  echo "exit=$?"
done
```

## Payloads

Six known-bad payloads — one per violation category `scripts/enforce-agent-rules.mjs` checks — and
one known-good payload, in on-screen demo order:

| File                                       | Category                                                                              | Expected result  |
| ------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------- |
| `01-wait-for-timeout.json`                 | `page.waitForTimeout(...)`                                                            | blocked (exit 2) |
| `02-raw-locator-outside-adapter.json`      | raw CSS `.locator(...)` outside `shared/anchor-helpers/`                              | blocked (exit 2) |
| `03-hardcoded-url.json`                    | hardcoded `http(s)://` literal in a test file                                         | blocked (exit 2) |
| `04-explicit-any.json`                     | `: any`                                                                               | blocked (exit 2) |
| `05-floating-playwright-call.json`         | unawaited Playwright call                                                             | blocked (exit 2) |
| `06-page-object-instantiation-bypass.json` | `new TubiHomePage(page)` outside a fixture/adapter file                               | blocked (exit 2) |
| `07-known-good.json`                       | a real excerpt of `shared/anchor-helpers/juice-shop/JuiceShopHomePage.ts`, unmodified | allowed (exit 0) |

Each payload's `tool_input.content` is a realistic Write/Edit body, not a fabricated log — `07` is
the actual current content of a real, passing adapter file, read at generation time. Regenerate all
seven with:

```bash
node examples/m09/generate-payloads.mjs
```
