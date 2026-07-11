# Healer-Review Checklist

The Playwright Test Agents healer proposes patches when a test fails. Some patches are correct. Some are band-aids that hide bugs. **This checklist runs before any healer patch merges.**

Referenced in M09 lecture 9.E. Apply to every patch. No exceptions.

---

## The Four Questions

For every healer-proposed patch, answer all four questions BEFORE merging. If you cannot answer **yes** to all four, REJECT the patch and route the fix elsewhere (adapter, page object, revert, or escalate to a human bug).

### 1. Does the patched assertion verify the same user-facing behavior?

A test that asserted "the play button is visible" must still assert that the user can see and act on a play button.

Patches that change `toBeVisible` to `toBeAttached` weaken DOM-presence into a tautology. Patches that change `toHaveText("Play")` to `toHaveText(/.*/)` make any string pass. Patches that change `toHaveCount(10)` to `toHaveCount.greaterThanOrEqual(1)` accept a sidebar widget instead of a content grid.

**If the patched assertion is weaker than the original, REJECT.**

### 2. If the test was failing because of a real regression, would the patched version pass anyway?

Run the patched test against the broken state that caused the original failure. If the patched test now passes against the broken state, the patch has hidden the regression.

This requires reproducing the regression locally. It is not optional. The healer's patches are _seductive_ — they make the green light come on. Verifying that the green light is still meaningful is your job.

**If running the patched test against the regression state shows green, REJECT.**

### 3. Did the patch change WHAT is being tested or just HOW?

Locator updates (`page.locator('.foo')` → `page.getByRole('button', { name: 'Foo' })`) are usually acceptable — the test still asserts the same thing through a different selector. Acceptable.

Assertion updates (`toBeVisible` → `toBeAttached`, `toHaveText("X")` → `toHaveText(/.*/)`, `toHaveCount(10)` → `toHaveCount(5)`) are suspect by default. Assertions are intent. The healer doesn't know what your test was supposed to verify.

**If the patch changed an `expect()` clause, INVESTIGATE before accepting.**

### 4. Is the fix in the right place?

Locator fixes belong in the adapter, not the test. If the healer wants to update a selector, the update should land in `shared/anchor-helpers/<site>/`, not inline in a test file. Every test that uses that selector benefits from the adapter-level fix.

Timing fixes belong in adapter methods like `waitForCarouselsLoaded()` or `triggerLazyLoad()`, never as `waitForTimeout()` in the test body. The project lint rule `playwright/no-wait-for-timeout` will block `waitForTimeout` patches anyway, but the principle is broader: tests describe intent, adapters describe mechanics.

Assertion changes belong in the test _only if the test's intent has genuinely changed_. If the intent hasn't changed, the assertion shouldn't either.

**If the patch lives in the test when it should live in the adapter, REJECT and rewrite.**

---

## Worked example (from M09.E)

**Scenario:** Hero banner test fails because Tubi's banner image is blocked. Element is in DOM but not visible.

**Healer's proposed patch:**

```diff
-await expect(tubiHome.heroBanner).toBeVisible();
+await expect(tubiHome.heroBanner).toBeAttached();
```

**Walkthrough:**

| #   | Question                                    | Answer                                                                                                                                                                 | Verdict |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | Same user-facing behavior?                  | No — `toBeAttached` accepts an invisible element, `toBeVisible` doesn't.                                                                                               | REJECT  |
| 2   | Patched test passes against the regression? | Yes — element is in DOM, so `toBeAttached` returns true even though the page is broken.                                                                                | REJECT  |
| 3   | Assertion or locator change?                | Assertion change. Investigate.                                                                                                                                         | REJECT  |
| 4   | Fix in the right place?                     | No — the fix should be either (a) in the adapter's `waitForReady` to verify the banner image loaded, or (b) nowhere because the test is correctly flagging a real bug. | REJECT  |

**Action:** Patch rejected. Original failing test remains in the suite. PR blocked until the actual broken page is fixed.

---

## When the healer is right

The checklist isn't anti-healer. It's pro-rigor. Healer patches ARE sometimes correct — typically when a UI redesign shifted a locator while leaving behavior unchanged. Example:

**Scenario:** Sign-in button locator `getByRole('link', { name: 'Sign In' })` fails because designers updated the copy to "Log in."

**Healer's proposed patch:**

```diff
-page.getByRole('link', { name: 'Sign In' })
+page.getByRole('link', { name: 'Log in' })
```

**Walkthrough:**

| #   | Question                                    | Answer                                                                       | Verdict             |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------- | ------------------- |
| 1   | Same user-facing behavior?                  | Yes — the link still goes to the sign-in flow. Copy is cosmetic.             | OK                  |
| 2   | Patched test passes against the regression? | No regression here — the copy change was intentional.                        | OK                  |
| 3   | Assertion or locator change?                | Locator change.                                                              | OK                  |
| 4   | Fix in the right place?                     | **No** — this locator should live in the `TubiHomePage` adapter, not inline. | REJECT and rewrite. |

**Action:** Move the locator into the adapter. Test code references `tubiHome.signInLink` (already exists in this repo's adapter, in fact). Re-run; passes.

The healer's _direction_ was right. The healer's _placement_ was wrong. Question four caught it.

---

## Reviewer authority

The reviewer running this checklist has authority to:

1. Accept the patch as-is.
2. Accept the patch's _intent_ but rewrite to land in the correct file.
3. Reject the patch entirely; restore the failing test; escalate to a human bug investigation.

The reviewer does **not** have authority to:

- Accept a patch that fails any of the four questions.
- Skip the checklist because "the patch looks fine."
- Override the lint rules that the patch violates.

If you find yourself wanting to override the checklist, the right answer is usually "the test was wrong in the first place" — rewrite the test from scratch with the bug-finding intent restated. Healer patches are a debugging tool, not a test-rewrite shortcut.
