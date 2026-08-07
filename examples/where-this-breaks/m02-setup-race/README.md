# M02 — where setup projects break

Runnable version of the third failure mode from **2.F — Where this breaks + your turn**.

```bash
npx playwright test examples/where-this-breaks/m02-setup-race \
  --config=examples/where-this-breaks/playwright.config.ts
```

All three tests **pass**.

## `setup-half-succeeded.spec.ts`

`dependencies: ['setup']` guarantees the setup project **ran**. It does not guarantee it achieved
anything.

A setup that throws fails loudly and you fix it in minutes. A setup that **half-succeeds** — wrote
the auth file but the token inside is empty, seeded two of three records, logged in as the wrong
user — hands every dependent test a broken world and no signal at all.

## Why it costs a day

The message your suite prints is:

> `expected 3 items, found 0`

That reads like a bug in the feature, so that is where you look. The feature is fine. Nothing in
the failure mentions setup, which is the only place worth looking.

## The fix

Assert specific post-setup state in the **first test of every project that depends on setup**, and
write the message so it names setup:

> `setup seeded no items — setup did not complete`

Same broken world, one clear line, no wasted afternoon.

This is the same shape as 15.I's stale-`storageState` failure: when a dependency can silently
half-succeed, assert the thing that proves it fully succeeded.
