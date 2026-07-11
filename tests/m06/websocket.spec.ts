import { test, expect } from '../../shared/fixtures/index.js';
import { mockWebSocketLesson } from '../../shared/anchor-helpers/m06/mock-endpoints.js';

test.describe('M06 WebSocket routing', () => {
  test('routeWebSocket mocks server messages for the client', async ({ page }) => {
    await page.routeWebSocket(mockWebSocketLesson.wsUrl, (ws) => {
      ws.onMessage((message) => {
        if (message === 'subscribe-prices') {
          ws.send(JSON.stringify({ symbol: 'AAPL', price: 199.99 }));
        }
      });
    });

    await page.route(mockWebSocketLesson.pageRoutePattern, async (route) => {
      await route.fulfill({
        contentType: 'text/html',
        body: '<div id="price">waiting</div>',
      });
    });

    await page.goto(mockWebSocketLesson.pageUrl);
    await page.evaluate((wsUrl) => {
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => ws.send('subscribe-prices');
      ws.onmessage = (event) => {
        const payload = JSON.parse(String(event.data)) as { price: number };
        document.getElementById('price')!.textContent = String(payload.price);
      };
    }, mockWebSocketLesson.wsUrl);

    await expect(page.locator('#price')).toHaveText('199.99');
  });
});
