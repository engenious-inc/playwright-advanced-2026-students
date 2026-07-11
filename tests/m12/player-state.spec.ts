import { test, expect } from '../../shared/fixtures/index.js';
import { skipInHeadless } from '../../shared/test-guards.js';

/**
 * M12 — player state introspection via HTMLMediaElement (12.B live build).
 * Headed + local only: Tubi playback and ad timing are not deterministic in CI/headless.
 */
test.describe('M12 player state', () => {
  test('video player advances time when playing', async ({ tubiPlayer }) => {
    test.skip(!!process.env.CI, 'live Tubi is not a deterministic CI target');
    skipInHeadless('Tubi video playback needs headed mode');
    await tubiPlayer.gotoStableSample();
    await tubiPlayer.startPlayback();
    await tubiPlayer.waitForPlaybackStart();

    const delta = await tubiPlayer.measurePlaybackAdvance(2_000);

    expect(delta).toBeGreaterThan(1.0);
    expect(delta).toBeLessThan(3.0);
  });
});
