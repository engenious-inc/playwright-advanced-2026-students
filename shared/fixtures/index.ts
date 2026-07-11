import { test as base, expect } from '@playwright/test';
import { TubiHomePage } from '../anchor-helpers/tubi/TubiHomePage.js';
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
