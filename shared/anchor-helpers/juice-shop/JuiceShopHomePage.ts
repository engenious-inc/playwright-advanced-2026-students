import type { Locator } from '@playwright/test';
import { BasePage } from '../../BasePage.js';
import { JuiceShopEndpoints } from './endpoints.js';

/**
 * OWASP Juice Shop home page adapter.
 * Self-hosted via docker compose; default localhost:3000.
 */
export class JuiceShopHomePage extends BasePage {
  readonly path = '/';

  async goto(): Promise<void> {
    await this.page.goto(JuiceShopEndpoints.baseUrl + this.path);
    await this.dismissBanners();
    await this.waitForReady();
  }

  protected async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.searchBox.waitFor({ state: 'visible' });
  }

  get searchBox(): Locator {
    // Exact name: Juice Shop renders BOTH an "Open search" and a "Close search"
    // icon-button, so a loose /search/i regex matches two elements and trips
    // Playwright strict mode. The toggle we want is "Open search".
    return this.page.getByRole('button', { name: 'Open search' });
  }

  /**
   * Product cards on the home grid.
   *
   * Raw CSS selector (rule 4 exception): Juice Shop renders products as Angular
   * Material `<mat-card>` elements with no ARIA role, no accessible name on the
   * card itself, and no `data-testid`. There is no `getByRole`/`getByLabel`/
   * `getByText`/`getByTestId` that selects "a product card" — the Material
   * component class is the only structural handle. Scope assertions to children
   * (title, price) via role/text where possible.
   */
  get productCards(): Locator {
    return this.page.locator('mat-card[class*="product"]');
  }

  async dismissBanners(): Promise<void> {
    const cookieDismiss = this.page.getByRole('link', { name: /dismiss/i });
    if (await cookieDismiss.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cookieDismiss.click();
    }
    // Welcome dialog opens after application config loads (often >1s in CI).
    const welcomeDismiss = this.page.getByRole('button', { name: 'Close Welcome Banner' });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (!(await welcomeDismiss.isVisible({ timeout: 5_000 }).catch(() => false))) {
        break;
      }
      await welcomeDismiss.click({ timeout: 10_000 });
      await welcomeDismiss.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => undefined);
    }
    await this.page
      .locator('.cdk-overlay-backdrop')
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => undefined);
  }
}
