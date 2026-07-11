import type { Locator, Page } from '@playwright/test';

/**
 * Base class every Page Object Model extends.
 *
 * Convention: page objects encapsulate *behavior*, not just selectors.
 * If a page object exposes raw locators, push the assertion inside the method instead.
 */
export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  abstract readonly path: string;

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForReady();
  }

  /**
   * Override in subclasses to assert the page is in a known-good state.
   * Default implementation waits for network idle.
   */
  protected async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  url(): string {
    return this.page.url();
  }

  async title(): Promise<string> {
    return this.page.title();
  }

  protected getByRole(
    role: Parameters<Page['getByRole']>[0],
    options?: Parameters<Page['getByRole']>[1],
  ): Locator {
    return this.page.getByRole(role, options);
  }
}
