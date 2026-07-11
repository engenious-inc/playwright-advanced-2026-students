import { test as base } from '@playwright/test';
import { faker } from '@faker-js/faker';

type DataFixtures = { testRunId: string; uniqueEmail: string };

export const dataTest = base.extend<DataFixtures>({
  testRunId: async ({}, use) => {
    await use(process.env.TEST_RUN_ID ?? faker.string.uuid());
  },
  uniqueEmail: async ({ testRunId }, use) => {
    await use(`m14-${testRunId}@example.com`);
  },
});
