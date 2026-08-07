# M20 — where LLM-as-judge breaks

Runnable version of the fourth failure mode from **20.F — Where this breaks + close**.

```bash
npx playwright test examples/where-this-breaks/m20-green-judge \
  --config=examples/where-this-breaks/playwright.config.ts
```

Both tests **pass**. Nothing here fails, because nothing here is broken — that is the finding.

## `judge-passes-a-wrong-answer.spec.ts`

An LLM-as-judge scores an answer against a rubric. Rubrics are written in terms a model can
evaluate: is it on topic, is it the right length, does it cite a source, is the tone right. Every
one of those is a question about **shape**.

So a confident, well-structured, correctly-cited answer scores well whether or not the number in
it is right. The example's answer says "100 GB" when the truth is 10, and the judge returns a
perfect 1.0.

The judge is not lying and not broken. It answered the question it was asked. The question just
was not "is this true?"

## Why there is no live model here

Calling a real judge would make the example non-deterministic and would test the vendor rather
than the lesson. The lesson is about **harness design** — where you place the correctness check —
and that is fully demonstrable with a stub that behaves the way real judges behave.

The stub is deliberately generous on shape and silent on fact, which is the realistic failure
shape, not a strawman.

## The fix is the course's own thesis

Cheap deterministic thing first; the model for what only a model can do.

The claim "100 GB" is checkable against data the system already has — no inference, no cost, no
flakiness. Pin the facts deterministically, then let the judge score tone, relevance and citation
quality, and require **both** to ship.

A judge is a quality signal. It is never a correctness oracle.
