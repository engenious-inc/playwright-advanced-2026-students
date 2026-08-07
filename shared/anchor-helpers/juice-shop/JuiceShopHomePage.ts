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
    // Verified against the pinned image (bkimminich/juice-shop:v17.1.1, 2026-08-06). The search
    // toggle is NOT a button in this build — `getByRole('button', { name: 'Open search' })`
    // matches zero elements. It carries aria-label "Click to search" on a non-button element,
    // so getByLabel is the locator that resolves it.
    return this.page.getByLabel('Click to search');
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
   *
   * Verified against the pinned image (v17.1.1, 2026-08-06): the product grid renders 12
   * `mat-card.ribbon-card` elements. The previous `mat-card[class*="product"]` matched ZERO —
   * no card carries a "product" class in this build.
   */
  get productCards(): Locator {
    return this.page.locator('mat-card.ribbon-card');
  }

  async dismissBanners(): Promise<void> {
    // Verified against the pinned image (v17.1.1, 2026-08-06): the cookie-consent dismiss is a
    // BUTTON ("dismiss cookie message"), not a link. The previous getByRole('link', …) matched
    // zero elements, so the banner was never dismissed — it then intercepted clicks and blocked
    // the product grid, which is why waitForReady() timed out on the search control.
    const cookieDismiss = this.page.getByRole('button', { name: /dismiss cookie message/i });
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
