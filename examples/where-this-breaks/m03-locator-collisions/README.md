# M03 — where role-based locators break

Runnable versions of two of the three failure modes from **3.E — Where this breaks + your turn**.
Both are fully hermetic: `page.setContent()`, no Tubi, no network, no credentials.

Run them:

```bash
npx playwright test examples/where-this-breaks/m03-locator-collisions \
  --config=examples/where-this-breaks/playwright.config.ts
```

**Expect 2 failures.** That is the point of this directory — the tests named `THE FAILURE`
reproduce the broken behaviour, and the ones named `THE FIX` show what to do instead.

## `role-name-collision.spec.ts` — role names collide

Two forms, each with a Submit button. `getByRole('button', { name: 'Submit' })` matches both and
Playwright throws a **strict-mode violation** rather than guessing.

The refusal is the feature. A framework that silently picked the first match would hand you a test
that passes today and clicks the wrong control after the next redesign — the failure would surface
later, somewhere else, as a mystery.

Two fixes, in order of preference:

- **Scope through the parent** (`getByRole('form', { name: 'Feedback' })`) — says what the test
  means rather than relying on document order.
- **Filter by a visible sibling** (`.filter({ has: ... })`) — for when there is no useful parent.
  Still semantic, so a restructure that preserves meaning survives it.

## `i18n-label-drift.spec.ts` — labels change with locale

`getByLabel('Email')` is a string match against rendered copy. Switch to Spanish and it stops
matching, though the control is unchanged. This is the same brittleness as a CSS chain in an
accessible-looking costume: the role is stable, but the **name is content**, and content gets
translated.

Two fixes:

- **A regex spanning your locales** — note it is a bare regex passed to `getByLabel`, _not_
  `{ name: ... }`, which is a `getByRole` option and would silently do nothing here.
- **Pin the locale** (`browser.newContext({ locale: 'en-US' })`) — stop testing translation by
  accident, and cover other languages in a deliberate i18n suite instead.

The production tell for this one: green in CI, where locale is forced, and red on a colleague's
machine whose browser negotiates something else.
