# M14 — where fixtures break

Runnable version of the third failure mode from **14.E — Where this breaks + your turn**.

```bash
npx playwright test examples/where-this-breaks/m14-fixture-pollution \
  --config=examples/where-this-breaks/playwright.config.ts
```

**Expect 1 failure** — `THE FAILURE`. The three other tests pass.

## `worker-scope-pollution.spec.ts`

A worker-scoped fixture is created once per worker and shared by every test that worker runs. That
is why you reach for one: it is the cheap way to avoid repeating expensive setup. The cost is that
the object is genuinely **shared**, so a test that mutates it hands the mutation to every test
after it.

The failing test never touches the fixture. It asserts the cart is empty, which is true when the
test runs alone, and false once the test above it has pushed an item.

## Why this specific flake is expensive

It is **order-dependent**, which defeats the normal debugging loop:

- Run the failing test on its own — it passes.
- Run the file — it fails.
- Change `--workers`, shard differently, or add a test above it — the failure moves to a different
  test, or disappears entirely.

That last one is the trap. A flake that vanishes when you change the run feels fixed. It isn't.

## The fix

Keep worker-scoped fixtures **immutable**. Anything a test mutates belongs in a test-scoped
fixture, which is rebuilt per test — the last two tests show the same push happening with no leak.

Note the file deliberately does **not** use `mode: 'serial'`. Serial would skip everything after
the first failure and hide the fixes. Playwright already runs a file's tests in declaration order
in a single worker — and that ordinary default is exactly why this bug is easy to ship.
