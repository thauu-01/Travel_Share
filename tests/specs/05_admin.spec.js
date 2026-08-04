const { expect } = require('chai');
const { createDriver } = require('../config/driver');
const LoginPage = require('../pages/LoginPage');
const AdminPage = require('../pages/AdminPage');

describe('05. Admin Dashboard & Self-Protection E2E Test', function () {
  this.retries(2);
  let driver;
  let loginPage;
  let adminPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    adminPage = new AdminPage(driver);

    // Login as Admin
    const email = process.env.TEST_ADMIN_EMAIL || 'admin_test@travelshare.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'AdminPass123!';
    await loginPage.login(email, password);
  });

  afterEach(async function () {
    if (this.currentTest.state === 'failed') {
      const filename = `FAIL_${this.currentTest.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
      await adminPage.takeScreenshot(`./tests/screenshots/${filename}`);
    }
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('5.1 Should navigate to Admin Users tab and verify self-demotion is disabled', async function () {
    await adminPage.openUsersTab();
    const isDemoteDisabled = await adminPage.isDemoteButtonDisabledForSelf();
    expect(isDemoteDisabled).to.be.true;
  });
});
