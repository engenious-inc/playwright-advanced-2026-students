# `examples/where-this-breaks/`

Runnable counter-examples paired with the "Where this breaks in production" lecture at the end of each module.

The course's signature beat is honesty about failure modes — every module ends with a 4–6 minute segment on how the technique just taught can fail in production. This directory holds the **executable** version of those failure modes: a test that demonstrates the failure, plus a comment explaining what the production-equivalent looks like.

## Coverage

Run everything: `npx playwright test examples/where-this-breaks --config=examples/where-this-breaks/playwright.config.ts`

| Module | Directory                      | Failure mode                                     |
| ------ | ------------------------------ | ------------------------------------------------ |
| M02    | `m02-setup-race`               | setup ran but half-succeeded                     |
| M03    | `m03-locator-collisions`       | role-name collision · i18n label drift           |
| M04    | `m04-route-blindspots`         | service-worker bypass of `page.route`            |
| M05    | `m05-har-leaks-pii`            | HAR captures token + PII verbatim                |
| M06    | `m06-lying-openapi`            | schema passes while the payload is wrong         |
| M06    | `m06-pdf-exact-string`         | brittle exact-string PDF assertion               |
| M09    | `m09-agents-drift`             | instruction file vs enforced lint rules          |
| M10    | `m10-tool-collisions`          | two servers, one tool name, silent overwrite     |
| M11    | `m11-cache-poisoning`          | stale Tier 1 hit resolves to the wrong control   |
| M12    | `m12-tainted-canvas`           | draw succeeds, pixel read throws `SecurityError` |
| M13    | `m13-clock-vs-server-time`     | `page.clock` moves the client, not the server    |
| M14    | `m14-fixture-pollution`        | worker-scoped fixture mutated across tests       |
| M15    | `m15-stale-storage-state`      | revoked session still renders signed-in          |
| M16    | `m16-refactor-loses-coverage`  | refactor stays green while dropping an assertion |
| M17    | `m17-performance-flake`        | cold-vs-warm cache divergence                    |
| M19    | `m19-component-vs-integration` | components green, composed page broken           |
| M20    | `m20-green-judge`              | judge passes an answer that is 10x wrong         |

### Modules with no runnable example, and why

Not every failure mode can be executed honestly. Faking one would model the anti-pattern the
lecture warns against, so these are documented rather than staged:

- **M01** — the "where this breaks" beat is introduced here as a recurring habit; the module names
  no technique-specific failure mode to reproduce.
- **M07, M08** — the failures are agent behaviours: ambiguous goals producing divergent plans,
  long-running loops drifting. Reproducing them requires a live model, which would make the example
  non-deterministic and test the vendor rather than the lesson.
- **M18** — alert fatigue, canary drift and monitoring blind spots are operational failures that
  appear over weeks of production signal, not within a test run.
- **M04's timing shift** — see `m04-route-blindspots/README.md`: an honest demo needs a genuinely
  slow arm, and this repo bans bare `setTimeout` in `tests/**` precisely so nobody papers over a
  race with artificial delay.

## Convention

```
examples/where-this-breaks/
└── m<NN>-<slug>/
    ├── README.md                     # what this failure mode is, when it bites
    └── <failure-name>.spec.ts        # the runnable failure
```

Each module's failure-mode demo is committed during its recording sprint, alongside the module branch (`m<NN>-<slug>`). The lecture script references the file path explicitly so students can `git checkout <branch>` and reproduce the failure end-to-end.

## Why a separate directory and not under `tests/`

The `tests/` directory is the working test suite — everything there should run green on `main`. The failure-mode examples are **intended to fail** (or pass-when-they-should-fail, which is the same problem). Keeping them out of the default Playwright test pattern (`tests/**/*.spec.ts`) ensures they don't pollute CI runs but stay accessible for live demos.

## Convention for new contributions

When recording a new module:

1. Add `m<NN>-<slug>/README.md` with the failure-mode framing (2-4 paragraphs).
2. Add `<failure-name>.spec.ts` exercising the failure.
3. Reference the path in the module's `*-where-this-breaks*.md` lecture script.
4. Confirm the file does NOT match `playwright.config.ts`'s `testMatch` glob.
