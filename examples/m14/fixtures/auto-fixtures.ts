import { test as base } from '@playwright/test';

export const autoTest = base.extend<{ apiTrace: void }>({
  apiTrace: [
    async ({ page }, use, testInfo) => {
      const urls: string[] = [];
      page.on('request', (req) => urls.push(req.url()));
      await use();
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('request-trace', {
          body: urls.join('\n'),
          contentType: 'text/plain',
        });
      }
    },
    { auto: true },
  ],
});
