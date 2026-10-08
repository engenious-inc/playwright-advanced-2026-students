import { test as base, expect } from '@playwright/test';
import { TubiHomePage } from '../anchor-helpers/tubi/TubiHomePage.js';
import { MockTubiHomePage } from '../anchor-helpers/tubi/MockTubiHomePage.js';
import {
  installMockTubiShell,
  MOCK_SHELL_CATEGORIES,
} from '../anchor-helpers/tubi/mock-endpoints.js';
import { TubiLiveTvPage } from '../anchor-helpers/tubi/TubiLiveTvPage.js';
import { TubiPlayerPage } from '../anchor-helpers/tubi/TubiPlayerPage.js';
import { JuiceShopHomePage } from '../anchor-helpers/juice-shop/JuiceShopHomePage.js';
import { ExpandTestingLoginPage } from '../anchor-helpers/expand-testing/ExpandTestingLoginPage.js';

/**
 * Typed fixtures providing pre-instantiated page objects per anchor.
 *
 * Add new anchors here so every test gets typed access without repetitive instantiation.
 * If a future swap replaces an anchor, only the import + instantiation here changes —
 * tests continue to consume the same fixture name.
 */
type AnchorFixtures = {
  tubiHome: TubiHomePage;
  mockTubiHome: MockTubiHomePage;
  tubiLiveTv: TubiLiveTvPage;
  tubiPlayer: TubiPlayerPage;
  juiceShopHome: JuiceShopHomePage;
  expandTestingLogin: ExpandTestingLoginPage;
};

export const test = base.extend<AnchorFixtures>({
  tubiHome: async ({ page }, use) => {
    const home = new TubiHomePage(page);
    await use(home);
  },
  // Essentials only. Installs the mocked shell and hands over the page object.
  // The test calls goto(); this fixture does not navigate.
  mockTubiHome: async ({ page }, use) => {
    await installMockTubiShell(page, MOCK_SHELL_CATEGORIES);
    await use(new MockTubiHomePage(page));
  },
  tubiLiveTv: async ({ page }, use) => {
    const liveTv = new TubiLiveTvPage(page);
    await use(liveTv);
  },
  tubiPlayer: async ({ page }, use) => {
    const player = new TubiPlayerPage(page);
    await use(player);
  },
  juiceShopHome: async ({ page }, use) => {
    const home = new JuiceShopHomePage(page);
    await use(home);
  },
  expandTestingLogin: async ({ page }, use) => {
    const login = new ExpandTestingLoginPage(page);
    await use(login);
  },
});

export { expect };
