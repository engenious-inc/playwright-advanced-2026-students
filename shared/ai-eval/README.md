# AI-eval scaffolding (M20)

The M20 "testing AI features" backbone. Applies the course's tiered thesis to
LLM **output** instead of locators:

| Tier                              | Mechanism                                                       | Lives in                                       |
| --------------------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| Tier 1 — deterministic guardrails | schema / PII / refusal / latency assertions                     | M20 example specs                              |
| Tier 2 — LLM-as-judge             | rubric-scored evaluation when there is no single correct string | `JudgeClient` + `loadRubric` + `passRateOverN` |
| Tier 3 — multimodal               | reuse the M11/M12 vision tier on image/video output             | `shared/tiered-ai`                             |

**Status:** typed stubs on this branch, exactly like `shared/tiered-ai`. The live
judge provider call and YAML rubric fixtures land on the `m20-testing-ai` branch
so default CI never spends money. `passRateOverN` is the one fully-implemented
pure helper (it has no provider dependency).

**Productized alternative:** Promptfoo (JS/TS, YAML, CLI) — see M20 20.C. Build this
once to understand what Promptfoo abstracts.
