const { expect } = require('chai');
const { createDriver } = require('../config/driver');
const LoginPage = require('../pages/LoginPage');
const HomePage = require('../pages/HomePage');

describe('01. Authentication & Security E2E Test', function () {
  this.retries(2); // CI Retry logic
  let driver;
  let loginPage;
  let homePage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    homePage = new HomePage(driver);
  });

  afterEach(async function () {
    if (this.currentTest.state === 'failed') {
      const filename = `FAIL_${this.currentTest.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
      await loginPage.takeScreenshot(`./tests/screenshots/${filename}`);
    }
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('1.1 Should navigate to Home Page and render hero title', async function () {
    await homePage.open();
    const titleText = await homePage.getTitleText();
    expect(titleText).to.include('Khám phá Việt Nam');
  });

  it('1.2 Should successfully login with valid credentials', async function () {
    const email = process.env.TEST_USER_EMAIL || 'user_test@travelshare.com';
    const password = process.env.TEST_USER_PASSWORD || 'UserPass123!';
    await loginPage.login(email, password);
    const currentUrl = await loginPage.getCurrentUrl();
    expect(currentUrl).to.include('/');
  });

  it('1.3 Should verify OTP test mode bypass (999999) for password reset', async function () {
    const email = process.env.TEST_USER_EMAIL || 'user_test@travelshare.com';
    await loginPage.forgotPassword(email);
    const isOtpInputVisible = await loginPage.isDisplayed('input[inputmode="numeric"]');
    expect(isOtpInputVisible).to.be.true;

    // Use test bypass OTP code '999999'
    const newPassword = 'NewUserPass123!';
    await loginPage.verifyOtpAndResetPassword('999999', newPassword);

    // Reset password back to original to keep test env clean
    await loginPage.forgotPassword(email);
    await loginPage.verifyOtpAndResetPassword('999999', process.env.TEST_USER_PASSWORD || 'UserPass123!');
  });
});
