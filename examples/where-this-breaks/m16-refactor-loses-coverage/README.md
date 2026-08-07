# M16 — where the capstone refactor breaks

Runnable version of the third failure mode from **16.H — Where this breaks and close**.

```bash
npx playwright test examples/where-this-breaks/m16-refactor-loses-coverage \
  --config=examples/where-this-breaks/playwright.config.ts
```

All three tests **pass**.

## `refactor-keeps-tests-green.spec.ts`

The capstone refactor makes a tangled suite readable: extract a helper, collapse duplication, push
assertions into shared setup. Every step keeps the suite green — and green is the signal everyone
trusts while refactoring.

But green only says the tests still **pass**. It says nothing about whether they still **check**.

Fold an assertion into a helper and forget to call it, and: the test count is unchanged, the
runtime improves, the diff reads as tidying — and a regression can now walk straight through.

A test suite is the one codebase where deleting work makes the metrics look better.

## The fix

Verify a refactor the way you verify a bug fix: **break the behaviour on purpose and confirm the
suite goes red.** The example flips `total: 42` to `999999` and asks whether each version of the
check notices. The tidy one does not.

If a mutation that used to be caught now survives, the refactor removed coverage — whatever the
pass count says.
