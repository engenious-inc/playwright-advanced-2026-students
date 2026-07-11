# M06 — OpenAPI spec that lies

**Failure mode:** Contract tests validate responses against a schema document, not against product truth. When the spec drifts from the implementation, green contract tests give false confidence.

**Production equivalent:** The spec declares `price` is a `string`; the API returns a JSON number. Ajv passes the wrong type if the schema is never updated — or fails loudly once you fix the schema to match reality.

**Run:** `npx playwright test examples/where-this-breaks/m06-lying-openapi/lying-openapi.spec.ts --config=examples/where-this-breaks/playwright.config.ts`

This spec uses a deliberately wrong schema so students see validation fail when the spec lies about field types.
