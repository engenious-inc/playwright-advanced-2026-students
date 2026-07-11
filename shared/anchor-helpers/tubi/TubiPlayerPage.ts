import type { Locator } from '@playwright/test';
import { BasePage } from '../../BasePage.js';
import { TubiEndpoints, TubiFixtures } from './endpoints.js';

/**
 * Tubi video player surface — M11 tier-3 demos and M12 playback tests.
 *
 * Raw `video` selector (rule 4 exception): the HTML5 `<video>` element has no
 * ARIA role and no stable test id on Tubi; it is the canonical playback API
 * surface for HTMLMediaElement introspection.
 */
export class TubiPlayerPage extends BasePage {
  readonly path = '/';

  get video(): Locator {
    return this.page.locator('video');
  }

  async gotoContent(contentPath: string): Promise<void> {
    await this.page.goto(TubiEndpoints.baseUrl + contentPath);
    await this.waitForReady();
  }

  /** Navigate to the recon-validated stable VOD title used in M12 demos. */
  async gotoStableSample(): Promise<void> {
    await this.gotoContent(TubiFixtures.stableVod);
  }

  protected async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.video.first().waitFor({ state: 'attached', timeout: 15_000 });
  }

  async startPlayback(): Promise<void> {
    const playControl = this.page.getByRole('button', { name: /play/i });
    await playControl.first().click();
  }

  async currentTime(): Promise<number> {
    return this.page.evaluate(() => document.querySelector('video')!.currentTime);
  }

  async waitForPlaybackStart(timeout = 10_000): Promise<void> {
    await this.page.waitForFunction(
      () => {
        const video = document.querySelector('video');
        return video !== null && !video.paused && video.currentTime > 0;
      },
      { timeout },
    );
  }

  async measurePlaybackAdvance(wallMs: number): Promise<number> {
    const t0 = await this.currentTime();
    // Deliberate wall-clock wait — the ONE legitimate use of waitForTimeout: we are measuring
    // how far real playback advances over a fixed real interval, so the wait IS the measurement,
    // not a flakiness band-aid. (Lint bans waitForTimeout in tests/**; this lives in shared/ and
    // carries this justification, matching AGENTS.md's "explain why" convention for exceptions.)
    await this.page.waitForTimeout(wallMs);
    const t1 = await this.currentTime();
    return t1 - t0;
  }
}
