# M06 — PDF exact-string assertions

**Failure mode:** PDF text extractors join glyph runs differently across `pdfjs-dist` versions and font layouts. An exact full-string assertion passes in CI today and flakes tomorrow even when the PDF content is unchanged.

**Production equivalent:** A report test that asserts `text === 'Total orders: $123.45'` breaks when word boundaries shift or the parser inserts extra spaces.

**Run:** `npx playwright test examples/where-this-breaks/m06-pdf-exact-string/pdf-exact-string.spec.ts --config=examples/where-this-breaks/playwright.config.ts`

The spec intentionally uses the brittle pattern from 6.D's anti-pattern discussion — compare with `tests/m06/report-generation.spec.ts`, which pattern-matches instead.
