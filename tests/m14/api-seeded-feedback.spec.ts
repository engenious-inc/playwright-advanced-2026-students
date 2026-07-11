import { hermeticTest as test, expect } from '../../examples/m14/fixtures/hermetic-feedback.js';
import { skipUnlessJuiceShopUp } from '../../shared/test-guards.js';

test.describe('M14 hermetic API seed', () => {
  test.beforeEach(async ({ request }) => {
    await skipUnlessJuiceShopUp(request);
  });

  test('creates feedback via API and exposes the record to the test', async ({
    seededFeedback,
    testRunId,
  }) => {
    expect(seededFeedback.comment).toBe(`m14-hermetic-${testRunId}`);
    expect(seededFeedback.id).toBeGreaterThan(0);
  });
});
