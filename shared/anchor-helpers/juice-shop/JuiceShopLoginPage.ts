import { BasePage } from '../../BasePage.js';
import { JuiceShopEndpoints, JuiceShopFixtures } from './endpoints.js';
import { JuiceShopHomePage } from './JuiceShopHomePage.js';

/** OWASP Juice Shop login form — used by M15 storage-state setup. */
export class JuiceShopLoginPage extends BasePage {
  readonly path = '/#/login';

  async goto(): Promise<void> {
    await this.page.goto(JuiceShopEndpoints.baseUrl + this.path);
    await new JuiceShopHomePage(this.page).dismissBanners();
  }

  async loginAsDefaultAdmin(): Promise<void> {
    await this.page
      .getByLabel('Text field for the login email')
      .fill(JuiceShopFixtures.defaultAdmin.email);
    await this.page
      .getByLabel('Text field for the login password')
      .fill(JuiceShopFixtures.defaultAdmin.password);
    await new JuiceShopHomePage(this.page).dismissBanners();
    const password = this.page.getByLabel('Text field for the login password');
    // Submit via Enter avoids Material overlay intercepting the submit button click in CI.
    await password.press('Enter');
  }
}
