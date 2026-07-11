import type { Locator } from '@playwright/test';
import { BasePage } from '../../BasePage.js';
import { ExpandTestingEndpoints } from './endpoints.js';

/**
 * Expand Testing login surface — M15 OAuth/MFA/passkey demos.
 * Credentials are env-driven; the site is a public practice target.
 */
export class ExpandTestingLoginPage extends BasePage {
  readonly path = ExpandTestingEndpoints.paths.login;

  async goto(): Promise<void> {
    await this.page.goto(ExpandTestingEndpoints.baseUrl + this.path);
    await this.waitForReady();
  }

  protected async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.usernameInput.waitFor({ state: 'visible', timeout: 10_000 });
  }

  get usernameInput(): Locator {
    return this.page.getByRole('textbox', { name: /username/i });
  }

  get passwordInput(): Locator {
    return this.page.getByLabel(/password/i);
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /login|sign in/i });
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
