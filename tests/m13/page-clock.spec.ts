import { test, expect } from '@playwright/test';

/**
 * M13 — page.clock demo with a client-side countdown (13.B live build).
 * Hermetic: Tubi premiere copy is server-rendered, so this uses inline HTML
 * to teach client-side clock control without a live anchor dependency.
 */
test.describe('M13 page.clock', () => {
  test('client-side premiere countdown updates after fast-forward', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-06-01T12:00:00Z') });
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <body>
          <p id="status" aria-live="polite"></p>
          <script>
            const premiere = new Date('2026-06-01T12:30:00Z').getTime();
            function render() {
              const diff = premiere - Date.now();
              const el = document.getElementById('status');
              if (diff <= 0) {
                el.textContent = 'Premiered';
              } else {
                const mins = Math.ceil(diff / 60000);
                el.textContent = 'Premieres in ' + mins + ' minutes';
              }
            }
            render();
            setInterval(render, 1000);
          </script>
        </body>
      </html>
    `);

    await expect(page.getByText(/premieres in/i)).toBeVisible();

    await page.clock.fastForward('30:00');

    await expect(page.getByText(/premiered/i)).toBeVisible();
  });
});
