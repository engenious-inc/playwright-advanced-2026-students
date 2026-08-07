# M17 — where performance budgets break

Runnable version of failure modes 2 and 3 from **17.F — Where this breaks + your turn**:
cold-vs-warm cache divergence, and the performance flake it causes.

```bash
npx playwright test examples/where-this-breaks/m17-performance-flake \
  --config=examples/where-this-breaks/playwright.config.ts
```

Both tests **pass**.

## `cold-vs-warm-cache.spec.ts`

A performance budget asserts a number, and the single biggest mover of that number is usually not
your code — it is whether the asset was already cached.

The example runs the same page twice in one context and counts requests server-side: the asset is
fetched once and served from cache the second time. Neither measurement is wrong. They answer
different questions — cold is a first-time visitor, warm is a returning one.

A budget that does not say which it means flakes on **test order**, and "fixes itself" when you
re-run, which is the worst possible signal.

## Why this example counts requests instead of timing

Timing on a shared CI box is exactly the noise this lecture is about. An example that asserted
milliseconds would be the very flake it teaches. Counting requests makes the divergence
deterministic while measuring the same underlying cause.

## The fix

Decide which scenario you are budgeting and construct it deliberately — a fresh context for cold,
a warmed one for warm — and budget each separately. Never let cache state be incidental.
