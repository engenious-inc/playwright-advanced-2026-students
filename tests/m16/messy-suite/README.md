# M16 capstone — the messy suite (`m16-messy-start`)

**You are looking at the starting state of the capstone.** These specs are deliberately awful.
Every smell here is intentional and maps to a lecture earlier in the course.

```bash
git checkout m16-messy-start   # this state — refactor from here
git checkout m16-clean-end     # the destination
git diff m16-messy-start m16-clean-end -- tests/m16 playwright.config.ts
```

That diff is the whole capstone.

## The rule

**Preserve every behaviour. Change how it is tested, never whether it is.**

The one exception is `admin can log in` — a false positive that asserts
`toHaveURL(/.*/)`, which is true of every page ever loaded. It tests nothing today, so "preserving
its behaviour" means giving it the assertion its name always implied.

## What is wrong here, and where you learned the fix

| Smell in this directory                                | Fix                                     | Module  |
| ------------------------------------------------------ | --------------------------------------- | ------- |
| `page.waitForTimeout(...)` hard waits                  | web-first assertions, locator auto-wait | M03     |
| Raw CSS / `#loginButton` id pins                       | `getByRole` / `getByLabel`              | M03     |
| `page.goto(BASE + …)` in tests; no page object         | `JuiceShop*Page` adapters               | M07/M08 |
| `dismissBannersInline` copy-pasted per test            | one adapter method, `dismissBanners()`  | M07     |
| Credentials typed inline                               | `JuiceShopFixtures` + typed fixtures    | M14     |
| Every test logs in again                               | `auth.setup.ts` + `storageState`        | M15     |
| `const v = await …isVisible(); expect(v).toBeTruthy()` | `await expect(locator).toBeVisible()`   | M03/M09 |
| `admin can log in` asserts `toHaveURL(/.*/)`           | assert the real logged-in state         | M09     |
| `if/else` branching inside a test                      | split into deterministic tests          | M09     |
| File-level `eslint-disable` hiding all of the above    | zero violations; delete the disable     | M02/M09 |

## Why this does not run in CI

`playwright.config.ts` carries `'**/m16/messy-suite/**'` in the browser projects' `testIgnore`.
The suite is a teaching catalogue of anti-patterns — it must not gate anyone's build, and its
hard waits would make CI slow and flaky for no benefit.

**Removing that `testIgnore` line is part of the refactor.** A clean suite earns its place in CI;
that is the point of the exercise, and it is visible in the tag diff.

## Grading

The rubric is in `docs/modules/M16-cicd-and-capstone/16G-capstone-refactor.md`; the move-by-move
walkthrough is `docs/m16-refactor-walkthrough.md`. Judgement is what is being measured — knowing
what to fix first, and when to stop.
