const { expect } = require('chai');
const { createDriver } = require('../config/driver');
const LoginPage = require('../pages/LoginPage');
const TripPlannerPage = require('../pages/TripPlannerPage');

describe('04. Trip Planner E2E Test', function () {
  this.retries(2);
  let driver;
  let loginPage;
  let tripPlannerPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    tripPlannerPage = new TripPlannerPage(driver);

    // Login first
    const email = process.env.TEST_USER_EMAIL || 'user_test@travelshare.com';
    const password = process.env.TEST_USER_PASSWORD || 'UserPass123!';
    await loginPage.login(email, password);
  });

  afterEach(async function () {
    if (this.currentTest.state === 'failed') {
      const filename = `FAIL_${this.currentTest.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
      await tripPlannerPage.takeScreenshot(`./tests/screenshots/${filename}`);
    }
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('4.1 Should create a new Trip schedule with isolated title', async function () {
    const tripTitle = `test_auto_trip_${Date.now()}`;
    await tripPlannerPage.createTrip(tripTitle, 'Mô tả lịch trình test tự động');
    const isTripVisible = await tripPlannerPage.isDisplayed(`//h3[text()='${tripTitle}']`);
    expect(isTripVisible).to.be.true;
  });
});
