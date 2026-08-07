# M04 — where `page.route` mocking breaks

The runnable version of the failure mode from **4.F — Where this breaks + your turn** that cannot
live in `tests/**`.

4.F names three failure modes. They are covered in two places, deliberately:

| Failure mode              | Where it is proven                                                     |
| ------------------------- | ---------------------------------------------------------------------- |
| CORS masking              | `tests/m04/4c-fixtures.spec.ts` — hermetic, so it belongs in the suite |
| Service-worker blind spot | **here** — needs a trustworthy origin and a real local server          |
| Timing shift              | not committed — see "What is not here" below                           |

Run it:

```bash
npx playwright test examples/where-this-breaks/m04-route-blindspots \
  --config=examples/where-this-breaks/playwright.config.ts
```

Both tests **pass**. Unlike the M03 examples, the failure case here does not fail — it asserts
that the trap exists (`handlerRan === false`). That makes it a regression guard as well as a
demo: if a future Playwright release starts routing service-worker traffic through `page.route`,
this test goes red and tells you the lecture needs updating.

## `service-worker-blindspot.spec.ts`

A real service worker with a cache-first `fetch` handler, served from `http://localhost` (a
trustworthy origin, so registration is allowed). When the worker answers from its own cache there
is **no network request at all**, so there is nothing for `page.route` to intercept. The mock is
never consulted and no error is raised — from the route handler's point of view, nothing happened.

The fix is `serviceWorkers: 'block'`, a **browser-context** option. There is no `launch()`
equivalent, and a fresh context does not help: every test already gets one, and the worker
registers inside it just the same.

### Two things this file learned the hard way

Both were found by running it, not by reasoning about it, and both are commented at the point they
matter:

1. **A freshly-registered worker does not control the page that registered it.** Without a reload
   after `ready`, the measured fetch goes straight to the network, `page.route` intercepts it, and
   the example asserts the _opposite_ of what 4.F teaches.
2. **Under `serviceWorkers: 'block'`, registration neither resolves nor rejects — it hangs.** A
   plain `try/catch` never fires, so a page that gates its fetch on registration sits idle forever
   and the fix looks broken when it is working. The registration is raced against a timeout.

## What is not here

The **timing-shift** failure mode has no committed example. Demonstrating it honestly needs a
genuinely slow arm, and this repo's ESLint bans bare `setTimeout` anywhere in `tests/**` precisely
so nobody papers over a race with an artificial delay. An example that faked the delay would model
the anti-pattern the lecture warns against. Left uncommitted on purpose rather than faked.
