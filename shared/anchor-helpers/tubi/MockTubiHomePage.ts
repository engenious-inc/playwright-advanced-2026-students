import { expect, type Locator } from '@playwright/test';
import { BasePage } from '../../BasePage.js';
import { MockTubi } from './mock-endpoints.js';

/**
 * Page object for the hermetic Tubi shell used by the Essentials lectures.
 * Navigation goes to MockTubi.pageUrl, which the fixture fulfills with page.route,
 * so this class never calls the live site.
 */
export class MockTubiHomePage extends BasePage {
  readonly path = MockTubi.pageUrl;

  async goto(): Promise<void> {
    await this.page.goto(MockTubi.pageUrl);
    await expect(this.searchBox).toBeVisible();
  }

  get searchBox(): Locator {
    return this.page.getByRole('textbox', { name: 'Search Tubi' });
  }

  get categoryNav(): Locator {
    return this.page.getByRole('navigation').first();
  }

  get moviesLink(): Locator {
    return this.page.getByRole('link', { name: 'Movies', exact: true });
  }

  get freeWithAds(): Locator {
    return this.page.getByRole('checkbox', { name: 'Free with ads' });
  }

  row(name: string): Locator {
    return this.page.getByRole('region', { name });
  }

  async fillSearch(query: string): Promise<void> {
    await this.searchBox.fill(query);
  }

  async openMovies(): Promise<void> {
    await this.moviesLink.click();
  }

  async checkFreeWithAds(): Promise<void> {
    await this.freeWithAds.check();
  }
}
