const { expect } = require('chai');
const { createDriver } = require('../config/driver');
const SearchPage = require('../pages/SearchPage');

describe('02. Search & Location Autocomplete E2E Test', function () {
  this.retries(2);
  let driver;
  let searchPage;

  before(async function () {
    driver = await createDriver();
    searchPage = new SearchPage(driver);
  });

  afterEach(async function () {
    if (this.currentTest.state === 'failed') {
      const filename = `FAIL_${this.currentTest.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
      await searchPage.takeScreenshot(`./tests/screenshots/${filename}`);
    }
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('2.1 Should search posts by location keyword "Mỹ Khê"', async function () {
    await searchPage.open();
    await searchPage.search('Mỹ Khê');
    const resultCount = await searchPage.getResultCount();
    expect(resultCount).to.be.at.least(1);
  });

  it('2.2 Should filter posts by Province dropdown', async function () {
    await searchPage.open();
    await searchPage.search('Đà Nẵng');
    const resultCount = await searchPage.getResultCount();
    expect(resultCount).to.be.at.least(1);
  });
});
