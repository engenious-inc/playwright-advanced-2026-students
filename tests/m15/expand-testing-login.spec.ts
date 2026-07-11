import { test, expect } from '../../shared/fixtures/index.js';

test.describe.configure({ retries: 1 });

test.describe('M15 Expand Testing auth surface', () => {
  test('login page exposes credential fields', async ({ expandTestingLogin }) => {
    await expandTestingLogin.goto();
    await expect(expandTestingLogin.usernameInput).toBeVisible();
    await expect(expandTestingLogin.passwordInput).toBeVisible();
    await expect(expandTestingLogin.submitButton).toBeVisible();
  });
});
