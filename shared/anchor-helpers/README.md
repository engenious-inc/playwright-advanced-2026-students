# Anchor helpers

Adapters that abstract the demo sites the course tests against. **Modules consume these adapters; modules never reference site URLs or selectors directly.** This is what makes the curriculum survive a site redesign or a site swap.

## Current anchors (v1.0)

| Slot                 | Site                                          | Adapter directory   |
| -------------------- | --------------------------------------------- | ------------------- |
| Primary + Video      | Tubi (`tubi.tv`)                              | `./tubi/`           |
| Controlled secondary | OWASP Juice Shop (Docker, localhost:3000)     | `./juice-shop/`     |
| Edge-case detour     | Expand Testing (`practice.expandtesting.com`) | `./expand-testing/` |

## Adapter contract

Each adapter exports:

- **One page object class per surface** — extends `BasePage`, encapsulates behavior, not raw selectors
- **A `<Anchor>Endpoints` object** — base URL, key API endpoints, configurable per environment
- **A `<Anchor>Fixtures` map** — known-good test data (user IDs, sample queries, expected counts) that other modules can rely on

## Swapping an anchor

If a site becomes unavailable or behavior changes:

1. Write a new adapter at `./<new-site>/` with the same exports as the one being replaced
2. Update `../fixtures/index.ts` to import from the new path
3. Run `npm run test` against the new adapter to verify all consuming modules still pass
4. Re-record only the **live-build segments** of affected module lectures — concept lectures stay valid

This is the "anchor swap" workflow promised by the curriculum. The whole point of the adapter pattern is that the heavy lift in swaps is the adapter, not the modules.
