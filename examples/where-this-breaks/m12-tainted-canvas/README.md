# M12 — where frame capture breaks

Runnable version of the first failure mode from **12.F — Where this breaks + your turn**.

```bash
npx playwright test examples/where-this-breaks/m12-tainted-canvas \
  --config=examples/where-this-breaks/playwright.config.ts
```

Both tests **pass**.

## `protected-pixels-block-capture.spec.ts`

M12's frame-capture technique draws the video to a `<canvas>` and reads the pixels back with
`toDataURL()` / `getImageData()`. That **read** is what the browser refuses on protected content:
the canvas is _tainted_, and the read throws a `SecurityError`.

The finding worth carrying: **the draw succeeds.** `drawImage()` does not throw. Any capture
helper that wraps the draw in a `try/catch` and reports success will happily claim it captured a
frame it never read a byte of.

## An honest word about what this reproduces

You cannot ship real DRM into a teaching example — a Widevine licence server is not something a
student can run, and pretending otherwise would be theatre.

But the browser rule that blocks you is **not DRM-specific**. It is the origin-taint rule, which
fires identically for any cross-origin media drawn without CORS. Same API, same exception, same
decision to make. This example triggers it with a cross-origin image served without
`Access-Control-Allow-Origin`, and says so rather than implying it is running DRM.

What transfers exactly: the draw/read asymmetry, the `SecurityError`, and the fix.

## The fix

Scope pixel-level assertions to open, non-DRM content. For protected streams, assert on what the
player reports about itself — `currentTime`, `buffered`, `readyState`, the 12.B material. It is a
weaker signal than pixels, and it is the honest one available.
