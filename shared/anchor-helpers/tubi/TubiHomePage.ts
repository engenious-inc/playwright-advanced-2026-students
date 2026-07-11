import { expect, type Locator } from '@playwright/test';
import { BasePage } from '../../BasePage.js';
import { TubiEndpoints } from './endpoints.js';

/**
 * Tubi home page adapter.
 *
 * Selectors validated via reconnaissance run on 2026-05-27.
 * If a method below stops working, fix it in this file only — tests should not change.
 *
 * Tubi's home page is structured as a list of category carousels (Recommended,
 * Movie Night, Leaving Soon, etc.) rather than a single hero. Search lives at /search,
 * accessed via a link (not an inline input).
 */
export class TubiHomePage extends BasePage {
  readonly path = '/';

  protected async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.tubiLogo.first().waitFor({ state: 'visible', timeout: 15_000 });
    // Carousels are lazy-loaded; tests that depend on them should use expect.poll
    // (or call waitForCarouselsLoaded) explicitly, so the responsibility is clear.
  }

  /** Wait for the first content carousel to render. Lazy; not part of waitForReady. */
  async waitForCarouselsLoaded(timeout = 30_000): Promise<void> {
    await this.categoryCarousels.first().waitFor({ state: 'visible', timeout });
  }

  async goto(): Promise<void> {
    await this.page.goto(TubiEndpoints.baseUrl + this.path);
    await this.waitForReady();
  }

  /** The Tubi brand link in the header (also appears in the footer). */
  get tubiLogo(): Locator {
    return this.page.getByRole('link', { name: 'Tubi logo' });
  }

  /** Top-level account links — visible without auth. */
  get signInLink(): Locator {
    return this.page.getByRole('link', { name: 'Sign In' });
  }

  get registerLink(): Locator {
    return this.page.getByRole('link', { name: 'Register' });
  }

  /** The main category navigation (single <nav> landmark with ~8 category links). */
  get categoryNav(): Locator {
    return this.page.getByRole('navigation').first();
  }

  /**
   * Hero/promo banner region — M09 lecture 9.E healer-band-aid demo target.
   * The 9.E recording injects a `[data-testid="hero-banner"]` element and blocks
   * its image via `page.route`; production Tubi may not ship this test id.
   */
  get heroBanner(): Locator {
    return this.page.getByTestId('hero-banner');
  }

  /**
   * Category carousel rows (home and hub pages).
   * Raw section+href filter (rule 4 exception): Tubi removed `data-testid`
   * attributes from production in 2026; carousels are `<section>` blocks whose
   * child links point at title routes (`/movies/:id`, `/tv-shows/:id`, etc.).
   */
  get categoryCarousels(): Locator {
    return this.page.locator('section').filter({
      has: this.page.locator('a[href^="/movies/"], a[href^="/tv-shows/"], a[href^="/series/"]'),
    });
  }

  /**
   * Visible title cards in category rows.
   * Raw class selector (rule 4 exception): Tubi tiles are `div.web-content-tile`
   * wrappers; nested title links are often `visibility:hidden` for layout, so
   * `getByRole` / href-based locators resolve to non-visible nodes.
   */
  get contentTiles(): Locator {
    return this.page.locator('div.web-content-tile');
  }

  /**
   * Link to the search page (Tubi search is its own route, not an inline input).
   *
   * Raw CSS attribute selector (rule 4 exception): the header search affordance
   * renders as an icon-only `<a href="/search">` with no accessible name, so
   * `getByRole('link', { name: ... })` has nothing to match and `getByLabel`/
   * `getByText` find no text. The stable `href` is the only resilient anchor.
   * (When the underlying markup gains an aria-label, switch to getByRole.)
   */
  get searchLink(): Locator {
    return this.page.locator('a[href="/search"]').first();
  }

  /** Navigate to the search page. */
  async openSearch(): Promise<void> {
    await this.searchLink.click();
    await this.page.waitForURL(/\/search/);
  }

  /** Navigate to search, type a query, submit. */
  async searchFor(query: string): Promise<void> {
    await this.openSearch();
    const input = this.page
      .getByRole('searchbox')
      .or(this.page.getByRole('textbox', { name: /search/i }))
      .first();
    await input.fill(query);
    await input.press('Enter');
  }

  /** Click a category link in the main nav by visible name (case-insensitive). */
  async browseCategory(name: string): Promise<void> {
    const link = this.categoryNav.getByRole('link', { name: new RegExp(name, 'i') });
    await link.click();
  }

  /**
   * Click a top-level menubar item (Browse / Movies / TV Shows / Live TV).
   * Added in M07 lecture 7.D — the menubar is distinct from the category nav;
   * tests reaching for Movies-as-link were the original failure point that
   * surfaced the adapter gap.
   */
  async browseMenuItem(name: string): Promise<void> {
    const item = this.page.getByRole('menuitem', { name: new RegExp(name, 'i') });
    await item.scrollIntoViewIfNeeded();
    await item.waitFor({ state: 'visible', timeout: 15_000 });
    await item.click({ timeout: 15_000 });
  }

  /**
   * Trigger lazy-loaded content on long-scroll pages.
   * Added in M07 lecture 7.F — the original Test Agents healer wanted to add a
   * `waitForTimeout` directly in the test; the correct fix routed the wait into
   * the adapter so every consuming test gets it for free.
   *
   * Scrolls until at least `minTiles` title cards render — Tubi's Movies hub
   * lazy-loads rows, so a single wheel burst often yields 10 tiles on first run.
   */
  async triggerLazyLoad(minTiles = 12): Promise<void> {
    await this.page.mouse.wheel(0, 800);
    await this.page.mouse.wheel(0, 800);

    await expect
      .poll(async () => {
        const count = await this.contentTiles.count();
        if (count < minTiles) {
          await this.page.mouse.wheel(0, 800);
        }
        return count;
      })
      .toBeGreaterThanOrEqual(minTiles);

    const tile = this.contentTiles.first();
    await tile.waitFor({ state: 'visible', timeout: 15_000 });
    await tile.scrollIntoViewIfNeeded();
  }

  /** Open the first visible title card on the current hub page. */
  async openFirstContentTile(): Promise<void> {
    const tile = this.contentTiles
      .filter({ has: this.page.locator('a[href^="/movies/"]') })
      .first();
    await tile.scrollIntoViewIfNeeded();
    // Title anchors inside tiles are often `visibility:hidden`; Playwright rejects
    // forced clicks on non-visible nodes, so trigger the native anchor click in-DOM.
    await tile.evaluate((element) => {
      const anchor = element.querySelector('a[href^="/movies/"]');
      if (!(anchor instanceof HTMLAnchorElement)) {
        throw new Error('Content tile is missing a /movies/ detail link');
      }
      anchor.click();
    });
    await this.page.waitForURL(/\/movies\/\d+/, { timeout: 15_000, waitUntil: 'commit' });
  }

  /** Direct-navigate to a category page by slug — bypasses the nav for stability. */
  async gotoCategory(slug: string): Promise<void> {
    await this.page.goto(`${TubiEndpoints.baseUrl}/category/${slug}`);
    await this.waitForReady();
  }
}
