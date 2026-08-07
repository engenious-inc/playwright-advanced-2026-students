# M19 — where component testing breaks

Runnable version of the first failure mode from **19.E — the course close**.

```bash
npx playwright test examples/where-this-breaks/m19-component-vs-integration \
  --config=examples/where-this-breaks/playwright.config.ts
```

All three tests **pass** — including the one that proves the composed page throws.

## `component-passes-integration-fails.spec.ts`

Component tests mount a component with props you supply. That isolation is the point: fast,
focused, no backend. It is also the blind spot — you are asserting the component behaves correctly
given inputs **you** chose, which says nothing about whether the app ever passes it those inputs.

Here the component is correct and its test is reasonable. The parent forwards the API shape
(`{ value, iso }`) to a component expecting `{ amount, currency }`. Every component is green; the
page throws.

The bug is not in any component. It is in the **seam**, which is precisely the region component
tests do not cover.

## Why there is no component-test runner here

Mounting the real thing would make the example about CT setup. The lesson is about coverage
boundaries, and it is fully visible with a plain render function — no Vite, no Storybook, no
framework choice imposed on the reader.

## The fix

An adapter at the boundary, and at least one test that exercises the real composition. Component
tests are a complement to integration coverage, never a replacement — the seam is where the bugs
live.
