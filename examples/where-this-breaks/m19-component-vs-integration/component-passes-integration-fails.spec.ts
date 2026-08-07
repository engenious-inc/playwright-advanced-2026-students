import { test, expect } from '@playwright/test';

/**
 * 19.E failure mode 1 — "test the component, miss the integration."
 *
 * Component tests mount a component with props you supply. That isolation is the point: fast,
 * focused, and no backend. It is also the blind spot — you are asserting the component behaves
 * correctly given inputs YOU chose, which says nothing about whether the app ever passes it those
 * inputs.
 *
 * Every component in the suite can be green while the page they compose is broken, because the
 * bug is not in any component. It is in the wiring between them: a prop that is never passed, a
 * shape that shifted on one side of the boundary, a null the parent forwards and the child never
 * anticipated.
 *
 * This runs without a component-test runner on purpose. Mounting the real thing would make the
 * example about CT setup; the lesson is about coverage boundaries, and it is visible with a plain
 * render function.
 *
 * Fix: component tests are a complement to integration coverage, never a replacement. Keep at
 * least one test that exercises the real composition — the seam is where the bugs live.
 */

type Price = { amount: number; currency: string };

/** The component under test. Correct, and tested in isolation with well-formed props. */
function PriceTag(price: Price): string {
  return `${price.currency}${price.amount.toFixed(2)}`;
}

/** The parent. This is where the bug is: it forwards the API shape without adapting it. */
function ProductCard(apiResponse: { price: { value: number; iso: string } }): string {
  // The API returns { value, iso }. PriceTag expects { amount, currency }. Nothing here converts.
  const forwarded = apiResponse.price as unknown as Price;
  return `<div>${PriceTag(forwarded)}</div>`;
}

test('the component test passes — because it is handed exactly what it expects', () => {
  // This is the component test a team would actually write, and it is not wrong.
  expect(PriceTag({ amount: 9.5, currency: '$' })).toBe('$9.50');
  expect(PriceTag({ amount: 0, currency: '£' })).toBe('£0.00');
});

test('THE FAILURE — composed with the real API shape, the same component breaks', () => {
  const apiResponse = { price: { value: 9.5, iso: 'USD' } };

  // Green component + green component = broken page. The component never receives `amount`, so
  // `amount.toFixed` is called on undefined. No component test could have caught this, because
  // no component test ever supplied the real shape.
  expect(() => ProductCard(apiResponse)).toThrow(TypeError);
});

test('THE FIX — an adapter at the seam, covered by an integration-level test', () => {
  const toPrice = (p: { value: number; iso: string }): Price => ({
    amount: p.value,
    currency: p.iso === 'USD' ? '$' : p.iso,
  });

  const fixedCard = (apiResponse: { price: { value: number; iso: string } }) =>
    `<div>${PriceTag(toPrice(apiResponse.price))}</div>`;

  // The assertion that matters runs across the boundary, not inside one side of it.
  expect(fixedCard({ price: { value: 9.5, iso: 'USD' } })).toBe('<div>$9.50</div>');
});
