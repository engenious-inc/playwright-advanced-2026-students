import { test, type APIRequestContext } from '@playwright/test';
import { JuiceShopEndpoints } from './anchor-helpers/juice-shop/endpoints.js';

/** Tubi lazy-loaded tiles and menubar flows need a real renderer — skip in headless runs. */
export function skipInHeadless(reason: string): void {
  test.skip(test.info().project.use.headless !== false, reason);
}

/** Desktop menubar navigation is not exposed on mobile viewports. */
export function skipOnMobile(reason: string): void {
  test.skip(test.info().project.name === 'mobile-chrome', reason);
}

/** Skip when the Juice Shop Docker stack is not reachable on localhost:3000. */
export async function skipUnlessJuiceShopUp(request: APIRequestContext): Promise<void> {
  try {
    const response = await request.get(JuiceShopEndpoints.baseUrl + '/', { timeout: 3_000 });
    test.skip(!response.ok(), 'Juice Shop not running — run: npm run juice-shop:up');
  } catch {
    test.skip(true, 'Juice Shop not running — run: npm run juice-shop:up');
  }
}
