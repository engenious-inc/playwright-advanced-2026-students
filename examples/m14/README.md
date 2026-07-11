# M14 — fixture pattern examples

Companion to **14.B** (five fixture levels) and **14.D** (hermetic API seeding).

| File                                | Pattern                    |
| ----------------------------------- | -------------------------- |
| `fixtures/data-fixtures.ts`         | Level 1 — `test.extend`    |
| `fixtures/worker-scope-fixtures.ts` | Level 2 — worker scope     |
| `fixtures/auto-fixtures.ts`         | Level 3 — auto-fixtures    |
| `fixtures/lifecycle-fixtures.ts`    | Level 4 — dependency graph |
| `merged-fixtures.ts`                | Level 5 — `mergeTests`     |
| `fixtures/hermetic-feedback.ts`     | 14.D — API-seeded cleanup  |

Run: `npm run test:m14`
