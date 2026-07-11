import { test as base, chromium, type BrowserContext } from '@playwright/test';
import { cp, rm } from 'node:fs/promises';
import path from 'node:path';

/**
 * Worker-scoped persistent profile checkout — M15 lecture 15.G.
 * Illustration fixture; requires a warmed template at `.profiles/warmed-template`.
 */
export const test = base.extend<{}, { workerProfile: BrowserContext }>({
  workerProfile: [
    async ({}, use, workerInfo) => {
      const template = path.resolve('.profiles/warmed-template');
      const lease = path.resolve('.profiles/leased', `w${workerInfo.parallelIndex}`);

      await cp(template, lease, { recursive: true });
      const context = await chromium.launchPersistentContext(lease, { headless: true });
      await use(context);
      await context.close();
      await rm(lease, { recursive: true, force: true });
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
