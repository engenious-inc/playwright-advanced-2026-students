import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { skipUnlessJuiceShopUp } from '../../shared/test-guards.js';

/**
 * M14 — seeded Faker replay loop against Juice Shop registration API.
 */
test.describe('M14 Faker seed replay', () => {
  test('same seed yields the same generated email', async ({ request }) => {
    await skipUnlessJuiceShopUp(request);
    faker.seed(42);
    const emailA = faker.internet.email();
    faker.seed(42);
    const emailB = faker.internet.email();
    expect(emailA).toBe(emailB);
  });

  test('plus-addressing preserves the seeded base local part and domain', () => {
    faker.seed(7);
    const base = faker.internet.email();
    const [local, domain] = base.split('@');
    const plusEmail = base.replace('@', '+alias@');
    // The transform must insert the tag between local and domain — not just contain a '+'.
    expect(plusEmail).toBe(`${local}+alias@${domain}`);
    expect(plusEmail).toMatch(/^[^@]+\+alias@[^@]+\.[^@]+$/);
  });
});
