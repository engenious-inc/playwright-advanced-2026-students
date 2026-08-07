# M10 — where MCP tool registries break

Runnable version of the third failure mode from **10.G — Where this breaks + your turn**.

```bash
npx playwright test examples/where-this-breaks/m10-tool-collisions \
  --config=examples/where-this-breaks/playwright.config.ts
```

Both tests **pass**.

## `tool-name-collision.spec.ts`

An LLM addresses tools by **name**. Connect two MCP servers that both expose `search` — or
`get_status`, or `run_query` — and one name now points at two implementations with different
arguments and different blast radii.

Registries are usually a map, so the second registration silently overwrites the first. Every call
the model believed was going to the analytics server now lands on the filesystem server.

## Why the model cannot save you here

It sees one tool. It gets a plausible response. It carries on and builds an answer on the wrong
data source.

This is worse than a broken tool, because a broken tool fails visibly. This one **succeeds at the
wrong thing** — and the tool that lost the race is the one you were relying on.

## The fix

Namespace tools by server (`analytics.search`), and make duplicate registration **throw** rather
than overwrite. That converts a silent production misroute into a startup error you fix once.
