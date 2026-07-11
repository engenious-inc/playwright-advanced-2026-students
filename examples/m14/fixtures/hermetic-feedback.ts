import { test as base, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { JuiceShopEndpoints } from '../../../shared/anchor-helpers/juice-shop/endpoints.js';

type FeedbackRecord = { id: number; comment: string };
type CaptchaPayload = { captchaId: number; answer: string };
type HermeticFixtures = { testRunId: string; seededFeedback: FeedbackRecord };

export const hermeticTest = base.extend<HermeticFixtures>({
  testRunId: async ({}, use) => {
    await use(process.env.TEST_RUN_ID ?? faker.string.uuid());
  },
  seededFeedback: async ({ request, testRunId }, use) => {
    const comment = `m14-hermetic-${testRunId}`;
    const captchaResponse = await request.get('/rest/captcha');
    expect(captchaResponse.ok()).toBeTruthy();
    const captcha = (await captchaResponse.json()) as CaptchaPayload;
    const response = await request.post(JuiceShopEndpoints.rest.feedback, {
      data: {
        comment,
        rating: 3,
        captchaId: captcha.captchaId,
        captcha: captcha.answer,
      },
    });
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { data: FeedbackRecord };
    try {
      await use(body.data);
    } finally {
      await request
        .delete(`${JuiceShopEndpoints.rest.feedback}/${body.data.id}`)
        .catch(() => undefined);
    }
  },
});

export { expect };
