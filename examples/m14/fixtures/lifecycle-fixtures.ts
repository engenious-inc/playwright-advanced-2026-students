import { test as base } from '@playwright/test';

type TestFixtures = { authenticatedLabel: string; sessionTag: string };
type WorkerFixtures = { browserSetup: void };

export const lifecycleTest = base.extend<TestFixtures, WorkerFixtures>({
  browserSetup: [
    async ({}, use) => {
      await use();
    },
    { scope: 'worker', auto: true },
  ],
  authenticatedLabel: async ({ browserSetup: _setup }, use, workerInfo) => {
    await use(`auth-w${workerInfo.workerIndex}`);
  },
  sessionTag: async ({ authenticatedLabel }, use) => {
    await use(`${authenticatedLabel}-session`);
  },
});
