# M16 capstone — the refactored suite (`m16-clean-end`)

**You are looking at the destination state of the capstone.** The directory keeps its
`messy-suite` name on purpose: the file paths are identical to `m16-messy-start`, so the tag diff
is a pure content diff of the refactor rather than a pile of renames. In your own repo you would
rename it.

```bash
git diff m16-messy-start m16-clean-end -- tests/m16 playwright.config.ts
```

That diff is the whole capstone.

## What changed

| Was                                                    | Now                                        | Module  |
| ------------------------------------------------------ | ------------------------------------------ | ------- |
| `page.waitForTimeout(...)` × 6                         | web-first assertions, locator auto-wait    | M03     |
| `page.locator('#loginButton')`                         | adapter + `getByLabel` / `getByRole`       | M03     |
| `page.goto(BASE + …)` in every test                    | `JuiceShopHomePage` / `JuiceShopLoginPage` | M07/M08 |
| `dismissBannersInline` copy-pasted                     | `dismissBanners()` inside `goto()`         | M07     |
| `'admin@juice-sh.op'` typed inline                     | `JuiceShopFixtures.defaultAdmin`           | M14     |
| manual login per test                                  | adapter `loginAsDefaultAdmin()`            | M15     |
| `const v = await …isVisible(); expect(v).toBeTruthy()` | `await expect(locator).toBeVisible()`      | M03/M09 |
| `admin can log in` → `toHaveURL(/.*/)`                 | asserts the real logged-in state           | M09     |
| `if/else` inside a test                                | two deterministic tests                    | M09     |
| file-level `eslint-disable` (4 rules)                  | **deleted** — nothing left to silence      | M02/M09 |

## Coverage was preserved, not traded away

The refactor rule is _change how a behaviour is tested, never whether it is_. Test count went from
5 to 5:

- three behaviours refactored in place (products visible, search present, basket present)
- the conditional test split into one deterministic test
- `admin can log in` kept its name and **gained** the assertion it never had

That last one is the only place coverage moved, and it moved **up**. The messy version asserted
`toHaveURL(/.*/)` — true of every page ever loaded — so it could not fail. A test that cannot fail
is not coverage; it is a green square. Deleting it would have "preserved" nothing.

## It now runs in CI

`playwright.config.ts` moved `m16/messy-suite` out of the browser projects' `testIgnore` and into
the `juice-shop` project's `testMatch`, alongside m06 and m14 — it needs Docker and the auth setup
project, like every other suite that drives the real anchor.

That move is the point of the exercise. A suite full of hard waits and a false positive has no
business gating anyone's build; a clean one earns it.

## Run it

```bash
npm run juice-shop:up
npx playwright test tests/m16/messy-suite --project=juice-shop
```
