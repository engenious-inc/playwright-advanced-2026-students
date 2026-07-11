# Tiered AI scaffolding

The course's architectural backbone (from Greg's InnovateQA 2026 keynote _Beyond the DOM_). Three tiers, used in order of preference — cheap thing first, smart thing when needed:

| Tier                       | Mechanism                                                               | Latency | Cost             | Use when                                                               |
| -------------------------- | ----------------------------------------------------------------------- | ------- | ---------------- | ---------------------------------------------------------------------- |
| **Tier 1 — Deterministic** | Cache + fuzzy structural match against the accessibility tree           | <100 ms | $0               | The element has a stable role/label and a recent cache hit             |
| **Tier 2 — a11y-LLM**      | Compact accessibility tree + LLM → element reference + confidence score | 1–2 s   | fractions of a ¢ | Tier 1 misses or confidence is low                                     |
| **Tier 3 — Vision**        | Screenshot → LLM with vision → pixel coordinates                        | 2–4 s   | fractions of a ¢ | No DOM (canvas, video player UIs, ad overlays), or Tiers 1–2 both fail |

## When each tier breaks

- **Tier 1 falls through** when the page changes structure and the cache misses
- **Tier 2 hallucinates** when the accessibility tree is sparse or ambiguous — the confidence score catches most cases, low-confidence responses fall through to Tier 3
- **Tier 3 misclicks** when the visual target is ambiguous or occluded — the next assertion in the test fails, surfacing as a normal test failure (never a silent pass)
- **All tiers fail simultaneously** during an LLM provider outage — the circuit breaker trips and tests degrade to Tier 1 only with an "AI degraded" run-report flag

## Files in this directory

- `tier1-deterministic.ts` — cache + structural match implementation
- `tier2-a11y-llm.ts` — accessibility-tree → LLM resolver
- `tier3-vision.ts` — screenshot → vision-model resolver
- `tiered-locator.ts` — the orchestrator: `await tieredLocate('Play button')` chains tiers automatically
- `circuit-breaker.ts` — short-circuit + degraded-mode handling

## Used in modules

- **M07** — Test Agents use Tier 2 implicitly via Playwright's accessibility tree
- **M11** — full tier walkthrough on intentional-bug Juice Shop examples
- **M12** — Tier 3 vision fallback for video player surfaces on Tubi
