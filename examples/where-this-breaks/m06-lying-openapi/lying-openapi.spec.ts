import { Ajv } from 'ajv';
import { test, expect } from '@playwright/test';

/** Spec says price is a string — the "real API" below returns a number (common drift). */
const lyingSchema = {
  type: 'object',
  required: ['id', 'name', 'price'],
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    price: { type: 'string' },
  },
};

const validate = new Ajv({ strict: false }).compile(lyingSchema);

test('contract passes a lying spec while the payload is numerically typed', async () => {
  const actualApiResponse = { id: 1, name: 'Apple Juice', price: 1.99 };

  // This fails: the spec lied about `price` being a string. Production would have shipped
  // the bug until someone updated the OpenAPI doc — or until a stricter schema caught it.
  expect(validate(actualApiResponse), JSON.stringify(validate.errors)).toBe(true);
});
