import { test, expect } from '../../shared/fixtures/index.js';
import { mockWebSocketLesson } from '../../shared/anchor-helpers/m06/mock-endpoints.js';

test.describe('M06 route precedence', () => {
  test('websocket route, HTTP route, trace, and HAR capture coexist', async ({ page, context }) => {
    await context.tracing.start({ snapshots: true });
    await context.tracing.startHar('test-results/m06-route-precedence.har');

    await page.routeWebSocket(mockWebSocketLesson.wsUrl, (ws) => {
      ws.onMessage((message) => ws.send(message));
    });

    await page.route('**/api/**', async (route) => route.continue());
    await page.route('**/api/config', async (route) => route.fulfill({ json: { feature: 'on' } }));

    await page.route(mockWebSocketLesson.pageRoutePattern, async (route) => {
      await route.fulfill({
        contentType: 'text/html',
        body: '<div id="status">ok</div>',
      });
    });

    await page.goto(mockWebSocketLesson.pageUrl);
    await expect(page.getByText('ok')).toBeVisible();
    await context.tracing.stop();
  });
});
