import { test as base, expect } from '@playwright/test';

type TestFixtures = { workerLabel: string };
type WorkerFixtures = { workerSeed: number };

export const workerScopeTest = base.extend<TestFixtures, WorkerFixtures>({
  workerSeed: [
    async ({}, use, workerInfo) => {
      await use(workerInfo.workerIndex);
    },
    { scope: 'worker' },
  ],
  workerLabel: async ({ workerSeed }, use) => {
    await use(`worker-${workerSeed}`);
  },
});

export { expect };
