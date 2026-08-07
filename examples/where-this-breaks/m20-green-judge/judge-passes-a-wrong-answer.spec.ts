import { test, expect } from '@playwright/test';

/**
 * 20.F failure mode 4 — "over-trusting a green judge on a subtly wrong answer."
 *
 * An LLM-as-judge scores an answer against a rubric. Rubrics are written in terms a model can
 * evaluate — is it on topic, is it the right length, does it cite a source, is the tone right —
 * and every one of those is a question about SHAPE. A confidently-worded, well-structured,
 * correctly-cited answer scores well whether or not the number in it is right.
 *
 * That is the trap: the judge is not lying and not broken. It answered the question it was asked.
 * The question just wasn't "is this true?"
 *
 * No live model here on purpose. Calling a real judge would make this example non-deterministic
 * and would test the vendor, not the lesson — and the lesson is about harness design, which is
 * fully demonstrable with a stubbed judge that behaves the way real ones do.
 *
 * Fix: this is the course's tiered thesis applied to AI output. Cheap deterministic checks first
 * — the facts you can verify — and reserve the model for what only a model can judge. A judge is
 * a quality signal, never a correctness oracle.
 */

/** The product's answer. Well-formed, well-cited, on-topic — and off by a factor of ten. */
const ANSWER = {
  text: 'Your plan includes 100 GB of storage. See the pricing page for details.',
  citations: ['https://example.com/pricing'],
};

/** Ground truth the system already knows, because it is what the API returns. */
const TRUTH = { storageGb: 10 };

/**
 * Stubbed judge, scoring the things a rubric can actually ask a model about. Deliberately
 * generous on shape and silent on fact — which is exactly how a real one behaves.
 */
function rubricJudge(answer: typeof ANSWER) {
  const onTopic = /storage|plan|gb/i.test(answer.text);
  const cited = answer.citations.length > 0;
  const concise = answer.text.length < 200;
  const score = [onTopic, cited, concise].filter(Boolean).length / 3;
  return { score, verdict: score >= 0.8 ? 'pass' : 'fail' };
}

test('THE TRAP — the judge passes an answer that states the wrong number', async () => {
  const result = rubricJudge(ANSWER);

  // Green. On topic, cited, concise — a perfect score.
  expect(result.verdict).toBe('pass');
  expect(result.score).toBe(1);

  // And the answer is wrong by 10x. Nothing in the rubric could have caught it, because nothing
  // in the rubric compared the claim to anything real. A suite that asserts only on the judge's
  // verdict ships this.
  expect(ANSWER.text).toContain('100 GB');
  expect(TRUTH.storageGb).toBe(10);
});

test('THE FIX — check the verifiable fact deterministically, then let the judge judge style', async () => {
  // Tier 1: the claim is checkable against data you already have. No model required, no
  // flakiness, no cost. This is the assertion that fails on the answer above.
  const claimed = Number(ANSWER.text.match(/(\d+)\s*GB/i)?.[1]);
  const factuallyCorrect = claimed === TRUTH.storageGb;
  expect(factuallyCorrect).toBe(false);

  // Tier 2: with facts pinned, the judge is doing the job it is actually good at — tone,
  // relevance, citation quality. Both signals must hold for the answer to ship.
  const style = rubricJudge(ANSWER);
  const shippable = factuallyCorrect && style.verdict === 'pass';
  expect(shippable).toBe(false);

  // Sanity: the same gate accepts a corrected answer, so it is not just always-false.
  const corrected = { ...ANSWER, text: ANSWER.text.replace('100 GB', '10 GB') };
  const fixedClaim = Number(corrected.text.match(/(\d+)\s*GB/i)?.[1]);
  expect(fixedClaim === TRUTH.storageGb && rubricJudge(corrected).verdict === 'pass').toBe(true);
});
