# M09 — where instruction files break

Runnable version of the first failure mode from **9.F — Where this breaks + your turn**.

```bash
npx playwright test examples/where-this-breaks/m09-agents-drift \
  --config=examples/where-this-breaks/playwright.config.ts
```

Both tests **pass**.

## `instructions-drift-from-lint.spec.ts`

Instruction files are prose. Lint config is executable. Nothing keeps them in step, and they drift
in **both** directions — each failing differently:

| Drift                                     | What happens                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Doc promises what lint does not enforce   | The agent is told a rule nothing catches. Violations reach review, and a human is the only backstop. |
| Lint enforces what the doc never mentions | The agent generates the banned pattern, hits lint, regenerates, hits it again.                       |

The second is the expensive surprise. Nothing is broken and nothing is red — you are simply paying
for inference in a loop that one documented line would end.

## The fix

Make the pair checkable. A test that cross-references the instruction file against the enforced
rule set turns "we should keep these in sync" into something CI fails on.

That is 9.D's lint-safety-net idea pointed at the instructions themselves — and it is why 2.F says
lint changes and `AGENTS.md` changes should always land in the same commit.
