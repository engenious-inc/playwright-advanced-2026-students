# M08 · 8.F — Manifest-driven framework generation

Companion artifact for lecture **8.F — "The manifest: one source of truth."** It shows the
whole pipeline the lecture describes, end to end and reproducible:

```
specs/m08-tubi-livetv.manifest.json   ─►  scripts/gen-framework.mjs  ─►  generated/
      (single source of truth)              (deterministic compiler)      (POM framework)
```

## What's here

| Path                                        | Origin                                                                                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `../../specs/m08-tubi-livetv.manifest.json` | The manifest — the **only** file you edit.                                                                                              |
| `generated/pages/TubiLiveTvPage.ts`         | Page object (`extends BasePage`); locators + actions from the manifest.                                                                 |
| `generated/fixtures.ts`                     | Typed fixture injecting the page object.                                                                                                |
| `generated/tests/seed.spec.ts`              | Seed spec — setup only, excluded from normal runs.                                                                                      |
| `generated/tests/live-tv/*.spec.ts`         | One spec per journey, organized by journey, each carrying `specSource` / `step` / `evidence` traceability back to its manifest journey. |

## Regenerate

```bash
npm run gen:framework      # rewrite generated/ from the manifest
npm run lint:generated     # --check: fail if generated/ drifts from the manifest (also in `npm run verify`)
```

`generated/` is **generator-owned**. Do not hand-edit anything under it — change the manifest and
regenerate. `npm run verify` runs `lint:generated`, so a hand-edit (or a stale checkout) fails CI.
Generation is deterministic: same manifest in, byte-identical output out, formatted with the repo's
Prettier config.

## Running the generated specs

The specs are **compile-, type-, and lint-verified** as part of `npm run verify`. Executing them
drives **live tubitv.com** through the page object, so — like the rest of the M08 Tubi demos — a run
needs a **US IP** and is not wired into the default `npm test` project matrix (these live under
`examples/`, not the configured `testDir`). To run them on record day, point Playwright at the
generated tests with a config whose `testIgnore` excludes the seed spec:

```ts
// testIgnore: ['**/seed.spec.ts']  — the seed belongs to the setup project, not the feature run
npx playwright test examples/m08-manifest/generated/tests --config <your-config>
```

The seed runs in the `setup` project (see M02.D + M14.D); `testIgnore` keeps it out of the ordinary
run so a setup step never counts as feature coverage.
