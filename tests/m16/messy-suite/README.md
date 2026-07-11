# M16 capstone — messy suite (`m16-messy-start`)

This is the deliberately-awful Playwright suite students refactor in lecture
**16.G** — the "before" state. **Do not fix these files**; the smells _are_ the
exercise. The clean destination is the separate `m16-clean-end` refactor.

The suite is `testIgnore`'d in every project (`playwright.config.ts`), so it does
not run in normal CI — it's a `git checkout m16-capstone` homework artifact. Run
it deliberately against a live Juice Shop:

```bash
npm run juice-shop:up
npx playwright test tests/m16/messy-suite --project=juice-shop
```

## Anti-patterns catalogued here (each maps to a refactor move in 16.G)

| File                       | Smells                                                                                                                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `basket-smells.spec.ts`    | hard `waitForTimeout`; no page-object                                                                                                                                                                                             |
| `login-and-search.spec.ts` | hard waits; no POM/fixtures; duplicated banner-dismissal; raw CSS ids; weak `isVisible()` assertion; a **false-positive** test that asserts nothing; conditional branching in a test; inline credentials duplicating the fixtures |

Refactor targets (16.G): role-based locators (M03) → adapter + typed fixtures
(M07/M14) → storage-state auth (M15) → delete hard waits, web-first assertions →
kill the false positive → lint clean (M02/M09). Preserve every assertion.

The end state is tag `m16-clean-end`; students `diff` start↔end. The full
~30-test suite and the recorded live refactor land during the 16.G recording
sprint. See `docs/m16-refactor-walkthrough.md`.
