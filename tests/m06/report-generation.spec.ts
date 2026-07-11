import { test, expect } from '../../shared/fixtures/index.js';
import { JuiceShopFixtures } from '../../shared/anchor-helpers/juice-shop/endpoints.js';
import { skipUnlessJuiceShopUp } from '../../shared/test-guards.js';
import { extractPdfText } from './pdf.js';

test.describe('M06 report generation', () => {
  test.beforeEach(async ({ request }) => {
    await skipUnlessJuiceShopUp(request);
  });

  test('orders report PDF contains booking details', async ({ request }) => {
    const login = await request.post('/rest/user/login', {
      data: JuiceShopFixtures.defaultAdmin,
    });
    expect(login.ok()).toBeTruthy();

    const { authentication } = (await login.json()) as {
      authentication: { token: string };
    };
    const headers = { Authorization: `Bearer ${authentication.token}` };

    const trigger = await request.post('/api/reports/orders', {
      headers,
      data: { format: 'pdf', range: 'last-30-days' },
    });
    expect(trigger.ok()).toBeTruthy();
    const { jobId } = (await trigger.json()) as { jobId: string };

    await expect
      .poll(
        async () => {
          const status = await request.get(`/api/reports/jobs/${jobId}`, { headers });
          return ((await status.json()) as { state: string }).state;
        },
        { timeout: 30_000, intervals: [500, 1000, 2000] },
      )
      .toBe('complete');

    const pdfResponse = await request.get(`/api/reports/jobs/${jobId}/download`, { headers });
    expect(pdfResponse.ok()).toBeTruthy();

    const text = await extractPdfText(await pdfResponse.body());
    expect(text).toContain('Total orders:');
    expect(text).toMatch(/\$\d+\.\d{2}/);
  });
});
