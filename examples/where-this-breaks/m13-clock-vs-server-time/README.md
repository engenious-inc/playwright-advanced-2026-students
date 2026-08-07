# M13 — where `page.clock` breaks

Runnable version of the second failure mode from **13.F — Where this breaks + your turn**.

```bash
npx playwright test examples/where-this-breaks/m13-clock-vs-server-time \
  --config=examples/where-this-breaks/playwright.config.ts
```

Both tests **pass**. Nothing errors and nothing warns — which is exactly why this one ships.

## `clock-does-not-move-server-time.spec.ts`

`page.clock` is a browser-side fake. It rewrites what `Date`, `setTimeout` and friends report
_inside the page_. It has no reach into your backend, so anything the server stamps keeps running
on real wall-clock time: an expiry, a "posted 3 minutes ago", a signed token's `exp`.

The example loads a page that prints two years side by side — one from the browser, one from an
API call — then advances the clock ten years. The browser says `+10`. The server, in the same
page, says today.

## Why this is worth a runnable demo

A suite built on `page.clock` alone will assert against two different notions of "now" and look
green the whole time. You do not discover it from a failure; you discover it when a date-sensitive
feature misbehaves in production and the test that "covered" it was only ever testing the client.

The fix is to control time at the source — a seeded fixture, an injectable clock, or an API that
accepts an "as of" parameter in test mode. `page.clock` covers the client half; something has to
cover the other half.

The `THE FIX` test stands in for that backend with a route override, so both halves agree. In a
real system you would rather have the server accept the test time than mock it away — mocking the
API is M04's material, with M04's caveats.
