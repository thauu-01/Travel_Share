const BasePage = require('./BasePage');
const { By } = require('selenium-webdriver');

class HomePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.heroTitle = By.css('h1');
    this.exploreBtn = By.css('a[href="/explore"]');
    this.searchBtn = By.css('a[href="/search"]');
    this.nextSlideBtn = By.css('button[aria-label="Slide tiếp theo"]');
    this.prevSlideBtn = By.css('button[aria-label="Slide trước"]');
    this.paginationDots = By.css('button[aria-label^="Go to slide"]');
  }

  async open() {
    await this.navigateTo('/');
  }

  async getTitleText() {
    return await this.getText(this.heroTitle);
  }

  async nextSlide() {
    await this.click(this.nextSlideBtn);
  }

  async prevSlide() {
    await this.click(this.prevSlideBtn);
  }
}

module.exports = HomePage;
