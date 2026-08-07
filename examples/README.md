# `examples/`

Two different kinds of thing live here, which is not obvious from the directory listing. This file
exists because "do we still need `m08-manifest` and `m14`?" is a reasonable question to ask on
seeing them next to `where-this-breaks/`.

## `where-this-breaks/` — failure demos

Runnable counter-examples paired with each module's closing "Where this breaks in production"
lecture. Some of these are **meant to fail**; that is the point. They are kept out of the default
`testMatch` so they never pollute CI, and they have their own config.

Seventeen directories across fifteen modules — see
[`where-this-breaks/README.md`](./where-this-breaks/README.md), which also records the modules that
have no runnable example and why.

## `m08-manifest/` — generated output. Do not hand-edit.

This is not a hand-written sample. `specs/m08-tubi-livetv.manifest.json` declares
`outDir: examples/m08-manifest/generated`, and `scripts/gen-framework.mjs` compiles the manifest
into a page object, fixtures, a seed spec and journey specs.

- Regenerate with `npm run gen:framework`.
- `npm run lint:generated` — part of `npm run verify` — regenerates in memory and **fails on any
  drift**, which is what makes 8.F's "0 files hand-edited" claim checkable rather than a promise.
- Lecture 8.F opens these exact files on camera.

Deleting it breaks `verify` and the 8.F demo.

## `m14/` — a source dependency of the test suite

Despite the name, this is not illustrative. Three specs import it directly:

| Spec                                    | Imports                                          |
| --------------------------------------- | ------------------------------------------------ |
| `tests/m14/api-seeded-feedback.spec.ts` | `examples/m14/fixtures/hermetic-feedback.js`     |
| `tests/m14/worker-scope.spec.ts`        | `examples/m14/fixtures/worker-scope-fixtures.js` |
| `tests/m14/merge-fixtures.spec.ts`      | `examples/m14/merged-fixtures.js`                |

Verified rather than assumed: moving the directory aside makes `tsc --noEmit` fail with
`TS2307: Cannot find module '../../examples/m14/...'` across all three specs.

It sits under `examples/` because M14 teaches the five levels of `test.extend` and the lecture
reads the fixtures as worked reference code. The specs then prove that code runs.

Deleting it breaks the build.

## Why the m14 specs do not run under `--project=chromium`

They are matched by a dedicated project in `playwright.config.ts` (alongside m06 and m15's
storage-state spec) and excluded from the browser projects, because they need the Juice Shop
container rather than an anchor site. `npx playwright test tests/m14 --project=chromium` reports
"No tests found" — that is configuration, not absence.
