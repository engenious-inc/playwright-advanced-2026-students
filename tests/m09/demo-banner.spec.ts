import { test, expect } from '../../shared/fixtures/index.js';

/**
 * M09 lecture 9.E — healer-band-aid demo fixture.
 * Injects a hero banner whose image is blocked via page.route so the element
 * is attached but not visible. Excluded from `npm test` via @healer-demo tag.
 * Invoke explicitly: `npx playwright test tests/m09/demo-banner.spec.ts`
 */
test.describe('M09 healer demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/m09-hero.webp', (route) => route.abort());

    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('[data-testid="hero-banner"]')) return;
        const banner = document.createElement('div');
        banner.setAttribute('data-testid', 'hero-banner');
        const img = document.createElement('img');
        img.src = '/m09-hero.webp';
        img.setAttribute('width', '400');
        img.setAttribute('height', '200');
        banner.appendChild(img);
        document.body.prepend(banner);
        img.addEventListener('error', () => {
          banner.style.visibility = 'hidden';
        });
      });
    });
  });

  test('tubi hero banner visible', { tag: '@healer-demo' }, async ({ tubiHome }) => {
    await tubiHome.goto();
    await expect(tubiHome.heroBanner).toBeVisible();
  });
});
