# M11 — where the tiered resolver breaks

Runnable version of the first failure mode from **11.F — Where this breaks + your turn**.

```bash
npx playwright test examples/where-this-breaks/m11-cache-poisoning \
  --config=examples/where-this-breaks/playwright.config.ts
```

Both tests **pass**. The poisoned lookup does not error — it answers instantly and wrongly.

## `tier1-cache-goes-stale.spec.ts`

The Tier 1 cache is the entire economic argument for the tiered model: it has to be nearly free,
or the ladder is pointless. It is keyed on the **description**, not on the page.

So when the UI changes underneath it, a stale entry keeps resolving. The example swaps two button
ids in a redesign — structurally valid, semantically inverted — and the cached "the confirm
button" now points at Cancel.

## Why a poisoned hit is worse than a miss

A **miss** escalates to Tier 2 and self-corrects. That is the ladder working.

A **poisoned hit never escalates**, because as far as the resolver is concerned it already
succeeded. The test clicks the wrong control and then reports on whatever happened next — so the
failure, if there is one, appears somewhere else entirely.

Cheap, confident and wrong is the most expensive combination in the whole model.

## The fix

Validate a cached hit against the live DOM before returning it, and key the cache on something
that changes when the page changes. A cache you re-check is worth more than a cache that cannot
be wrong.
