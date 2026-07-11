import { test as base, chromium, type BrowserContext } from '@playwright/test';
import { cp, rm, rename } from 'node:fs/promises';
import path from 'node:path';

/**
 * Test-scoped profile lease with quarantine-on-failure — M15 lecture 15.H.
 */
export const test = base.extend<{ profile: BrowserContext }>({
  profile: async ({}, use, testInfo) => {
    const lease = path.resolve('.profiles/leased', testInfo.testId);
    await cp(path.resolve('.profiles/warmed-template'), lease, { recursive: true });

    const context = await chromium.launchPersistentContext(lease, { headless: true });
    await use(context);
    await context.close();

    const poisoned = testInfo.status !== testInfo.expectedStatus;
    if (poisoned) {
      const dest = path.resolve(
        '.profiles/quarantine',
        `${testInfo.title.replace(/\W+/g, '-')}-${testInfo.testId}`,
      );
      await rename(lease, dest);
      testInfo.annotations.push({ type: 'quarantined-profile', description: dest });
    } else {
      await rm(lease, { recursive: true, force: true });
    }
  },
});

export { expect } from '@playwright/test';
