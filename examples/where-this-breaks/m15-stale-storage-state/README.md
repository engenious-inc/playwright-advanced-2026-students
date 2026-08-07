# M15 — where `storageState` breaks

Runnable version of the third failure mode from **15.I — Where this breaks + your turn**.

```bash
npx playwright test examples/where-this-breaks/m15-stale-storage-state \
  --config=examples/where-this-breaks/playwright.config.ts
```

Both tests **pass**. The revoked session does not error — it renders a convincing signed-in page.

## `storage-state-expires-server-side.spec.ts`

`storageState` is a snapshot of cookies and localStorage. Replaying it makes the **browser** look
logged in: the cookie is there, the app's client-side "am I authenticated?" check passes, the
signed-in shell renders. None of that consults your backend.

So when the session is revoked server-side — a password change, an admin logout-everywhere, a short
server TTL, a deploy that rotated the signing key — the saved state still produces a page that
looks right and whose every API call is a 401.

## Why this one costs so much time

The failure surfaces far from its cause. What your suite reports is:

> `expected 3 items, found 0`

…or a timeout waiting for content that will never arrive. Both read like a bug in the feature.
You go and debug the feature, which works. The auth layer looked fine because the visible half of
it _was_ fine.

## The fix

Assert against something only a live session can produce — an authenticated API call, not the
rendered shell — and do it in the **first test of every project that depends on setup**, so it
fails immediately and unmistakably.

This is the same shape as 2.F's setup-project timing advice: when a dependency silently
half-succeeds, assert the thing that proves it fully succeeded.
