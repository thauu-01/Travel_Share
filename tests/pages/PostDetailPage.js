const BasePage = require('./BasePage');
const { By } = require('selenium-webdriver');

class PostDetailPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.title = By.css('h1');
    this.imageCover = By.css('img[style*="cursor: zoom-in"]');
    this.lightboxOverlay = By.css('.fixed.inset-0.bg-black\\/95');
    this.lightboxCloseBtn = By.css('button[aria-label="Đóng"]');
    this.editPostBtn = By.css('a[href$="/edit"]');
  }

  async open(postId) {
    await this.navigateTo(`/posts/${postId}`);
  }

  async openLightbox() {
    await this.click(this.imageCover);
  }

  async closeLightbox() {
    await this.click(this.lightboxCloseBtn);
  }

  async isLightboxVisible() {
    return await this.isDisplayed(this.lightboxOverlay, 3000);
  }
}

module.exports = PostDetailPage;
