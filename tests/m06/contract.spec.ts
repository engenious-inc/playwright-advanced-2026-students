import { Ajv } from 'ajv';
import { test, expect } from '../../shared/fixtures/index.js';
import { skipUnlessJuiceShopUp } from '../../shared/test-guards.js';
import openApiSchema from './fixtures/juice-shop-openapi.json' with { type: 'json' };

const ajv = new Ajv({ strict: false });

const productSchema = openApiSchema.components.schemas.Product;
const validateProduct = ajv.compile(productSchema);

test.describe('M06 contract testing', () => {
  test.beforeEach(async ({ request }) => {
    await skipUnlessJuiceShopUp(request);
  });

  test('GET /api/Products returns products matching the teaching schema', async ({ request }) => {
    const response = await request.get('/api/Products');
    expect(response.status()).toBe(200);

    const { data: products } = (await response.json()) as {
      data: Array<Record<string, unknown>>;
    };
    expect(products.length).toBeGreaterThan(0);

    for (const product of products) {
      const valid = validateProduct(product);
      expect(valid, ajv.errorsText(validateProduct.errors)).toBe(true);
    }
  });
});
