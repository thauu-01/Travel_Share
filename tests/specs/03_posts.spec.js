const { expect } = require('chai');
const { createDriver } = require('../config/driver');
const PostDetailPage = require('../pages/PostDetailPage');

describe('03. Post Detail & Lightbox Carousel E2E Test', function () {
  this.retries(2);
  let driver;
  let postDetailPage;

  before(async function () {
    driver = await createDriver();
    postDetailPage = new PostDetailPage(driver);
  });

  afterEach(async function () {
    if (this.currentTest.state === 'failed') {
      const filename = `FAIL_${this.currentTest.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
      await postDetailPage.takeScreenshot(`./tests/screenshots/${filename}`);
    }
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('3.1 Should load post detail page (Post ID: 1)', async function () {
    await postDetailPage.open(1);
    const postTitle = await postDetailPage.getText('h1');
    expect(postTitle).to.include('Mỹ Khê');
  });

  it('3.2 Should open Lightbox on image click and close via X button', async function () {
    await postDetailPage.open(1);
    const isImageVisible = await postDetailPage.isDisplayed('img[style*="cursor: zoom-in"]');
    if (isImageVisible) {
      await postDetailPage.openLightbox();
      const isLightboxOpened = await postDetailPage.isLightboxVisible();
      expect(isLightboxOpened).to.be.true;

      await postDetailPage.closeLightbox();
      const isLightboxClosed = await postDetailPage.isLightboxVisible();
      expect(isLightboxClosed).to.be.false;
    }
  });
});
