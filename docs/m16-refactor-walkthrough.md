# M16 capstone refactor walkthrough

Companion to lecture **16.G** — the live refactor from a deliberately-awful
suite (`m16-messy-start`) to the course's destination state (`m16-clean-end`).

> **Current state:** the messy-start suite is committed on branch `m16-capstone`
> (`tests/m16/messy-suite/` — `basket-smells.spec.ts` + `login-and-search.spec.ts`),
> `testIgnore`'d so it doesn't run in normal CI. The `m16-clean-end` destination
> commit and the recorded single-take refactor land during the 16.G recording
> sprint (that take is the deliverable — the clean suite is verified live against
> Juice Shop while recording). Diff the two tags after it ships.

## Smell → fix mapping

Each anti-pattern in the messy suite maps to a refactor move and the module that
taught it. Preserve every assertion — refactor changes _how_ a behavior is
tested, never _whether_ it is.

| Smell (messy-start)                             | Fix (clean-end)                                               | Module  |
| ----------------------------------------------- | ------------------------------------------------------------- | ------- |
| `page.waitForTimeout(...)` hard waits           | web-first assertions + locator auto-wait                      | M03     |
| Raw CSS / `#id` selectors (`#loginButton`)      | `getByRole` / `getByLabel`                                    | M03     |
| No page-object; `page.goto(BASE + …)` in tests  | route interaction through `JuiceShop*Page` adapters           | M07/M08 |
| Duplicated banner-dismissal copy-pasted         | one adapter method (`dismissBanners`)                         | M07     |
| Inline credentials duplicating fixtures         | typed fixtures + `JuiceShopFixtures`                          | M14     |
| Fresh login in every test                       | worker-scoped auth via `tests/auth.setup.ts` + `storageState` | M15     |
| Weak `const v = await …isVisible(); expect(v)…` | `await expect(locator).toBeVisible()`                         | M03/M09 |
| **False-positive** test (`toHaveURL(/.*/)`)     | assert the real post-condition (logged-in state)              | M09     |
| Conditional `if/else` branching in a test       | split into two deterministic tests                            | M09     |
| Lint violations throughout                      | zero violations — conventions an agent can follow             | M02/M09 |

## Refactor order (as performed live in 16.G)

1. **M03 locators** — replace CSS/id pins with `getByRole` / `getByLabel`.
2. **M07/M14 structure** — move interaction into adapters; introduce typed fixtures.
3. **M15 auth** — `tests/auth.setup.ts` + storage state; stop logging in per test.
4. **Delete hard waits** — convert to web-first assertions.
5. **Kill the false positive** — make the "admin can log in" test actually assert login.
6. **M02/M09 lint** — drive violations to zero; remove the file-level `eslint-disable`.
7. **Run green** — same behavior, same coverage, clean suite.

Grade against the rubric taught in lecture 16.G. CI economics for
the refactored suite (sharding, blob/`merge-reports`, caching) are the 16.A
beat — runnable in `.github/workflows/sharded-example.yml`.
