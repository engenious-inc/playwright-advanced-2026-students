import type { Locator } from '@playwright/test';
import { BasePage } from '../../BasePage.js';
import { TubiEndpoints } from './endpoints.js';

/**
 * Tubi Live TV section adapter — added in M08 lecture 8.E.
 *
 * Channel rows and player chrome live on /live routes; keep locators here
 * so tests read like behavior, not DOM archaeology.
 */
export class TubiLiveTvPage extends BasePage {
  readonly path = '/live';

  protected async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForURL(/\/live/);
  }

  async goto(): Promise<void> {
    await this.page.goto(TubiEndpoints.baseUrl + this.path);
    await this.waitForReady();
  }

  /**
   * Channel rows in the Live TV guide. Production has no data-testid on these; each row's
   * logo button carries the stable class web-epg-row__logo (checked live 2026-10-21, 210 rows).
   */
  get channelRows(): Locator {
    return this.page.locator('.web-epg-row__logo[role="button"]');
  }

  /** Wait until at least one channel row is visible — routes timing into the adapter. */
  async waitForChannelGuideLoaded(timeout = 30_000): Promise<void> {
    await this.channelRows.first().waitFor({ state: 'visible', timeout });
  }
}
